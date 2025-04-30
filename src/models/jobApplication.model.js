import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        resume: {
            type: String,
            required: true
        },
        coverLetter: {
            type: String,
            required: false
        },
        status: {
            type: String,
            enum: ['pending', 'reviewing', 'interviewed', 'selected', 'rejected'],
            default: 'pending'
        }
    },
    { timestamps: true }
);

export const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);