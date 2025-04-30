import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { Job } from '../models/job.model.js';
import { JobApplication } from '../models/jobApplication.model.js';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

const createJob = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        requirements,
        salary
    } = req.body;

    if ([title, description, requirements].some(field => !field?.trim())) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const job = await Job.create({
        title,
        description,
        requirements,
        salary
    });

    return res.status(201).json(
        new ApiResponse(201, job, "Job posting created successfully")
    );
});

const updateJob = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        requirements,
        salary
    } = req.body;

    if ([title, description, requirements].some(field => !field)) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const job = await Job.findById(req.params.id);

    if (!job) {
        throw new ApiError(404, "Job not found");
    }

    const updatedJob = await Job.findByIdAndUpdate(
        req.params.id,
        {
            title,
            description,
            requirements,
            salary
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, updatedJob, "Job posting updated successfully")
    );
});

const deleteJob = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
        throw new ApiError(404, "Job not found");
    }

    await Job.findByIdAndDelete(req.params.id);

    return res.status(200).json(
        new ApiResponse(200, {}, "Job posting deleted successfully")
    );
});

const getJobById = asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
        throw new ApiError(404, "Job not found");
    }

    return res.status(200).json(
        new ApiResponse(200, job, "Job fetched successfully")
    );
});

const getAllJobs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;

    const query = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { requirements: { $regex: search, $options: "i" } }
        ];
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 }
    };

    const jobs = await Job.find(query)
        .limit(options.limit)
        .skip((options.page - 1) * options.limit)
        .sort(options.sort);

    const totalJobs = await Job.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            jobs,
            pagination: {
                total: totalJobs,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(totalJobs / options.limit)
            }
        }, "Jobs fetched successfully")
    );
});

const submitApplication = asyncHandler(async (req, res) => {
    const {
        jobId,
        fullName,
        email,
        phone,
        coverLetter
    } = req.body;

    if ([jobId, fullName, email, phone].some(field => !field?.trim())) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const job = await Job.findById(jobId);
    if (!job) {
        throw new ApiError(404, "Job not found");
    }

    if (!req.file) {
        throw new ApiError(400, "Resume is required");
    }

    const resumeUpload = await uploadOnCloudinary(req.file.buffer, req.file.originalname);
    if (!resumeUpload?.secure_url) {
        throw new ApiError(500, "Resume upload failed");
    }

    const application = await JobApplication.create({
        job: jobId,
        fullName,
        email,
        phone,
        coverLetter,
        resume: resumeUpload.secure_url
    });

    return res.status(201).json(
        new ApiResponse(201, application, "Application submitted successfully")
    );
});

const getApplicationById = asyncHandler(async (req, res) => {
    const application = await JobApplication.findById(req.params.id).populate('job');

    if (!application) {
        throw new ApiError(404, "Application not found");
    }

    return res.status(200).json(
        new ApiResponse(200, application, "Application fetched successfully")
    );
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    if (!['pending', 'reviewing', 'interviewed', 'selected', 'rejected'].includes(status)) {
        throw new ApiError(400, "Invalid status value");
    }

    const application = await JobApplication.findById(req.params.id);

    if (!application) {
        throw new ApiError(404, "Application not found");
    }

    const updatedApplication = await JobApplication.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
    ).populate('job');

    return res.status(200).json(
        new ApiResponse(200, updatedApplication, "Application status updated successfully")
    );
});

const getAllApplications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, jobId, status, search } = req.query;

    const query = {};

    if (jobId) {
        query.job = jobId;
    }

    if (status) {
        query.status = status;
    }

    if (search) {
        query.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } }
        ];
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 }
    };

    const applications = await JobApplication.find(query)
        .populate('job', 'title')
        .limit(options.limit)
        .skip((options.page - 1) * options.limit)
        .sort(options.sort);

    const totalApplications = await JobApplication.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            applications,
            pagination: {
                total: totalApplications,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(totalApplications / options.limit)
            }
        }, "Applications fetched successfully")
    );
});

const deleteApplication = asyncHandler(async (req, res) => {
    const application = await JobApplication.findById(req.params.id);

    if (!application) {
        throw new ApiError(404, "Application not found");
    }

    if (application.resume) {
        await deleteFromCloudinary(application.resume);
    }

    await JobApplication.findByIdAndDelete(req.params.id);

    return res.status(200).json(
        new ApiResponse(200, {}, "Application deleted successfully")
    );
});

export {
    createJob,
    updateJob,
    deleteJob,
    getJobById,
    getAllJobs,
    submitApplication,
    getApplicationById,
    updateApplicationStatus,
    getAllApplications,
    deleteApplication
};