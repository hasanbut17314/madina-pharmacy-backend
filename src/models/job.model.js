import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        requirements: {
            type: String,
            required: true
        },
        salary: {
            type: String,
            required: false
        }
    },
    { timestamps: true }
);

export const Job = mongoose.model('Job', jobSchema);