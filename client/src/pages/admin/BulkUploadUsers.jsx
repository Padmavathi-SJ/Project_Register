import React, { useState } from 'react';
// import axios from 'axios';
import instance from '../../utils/axiosInstance';

const BulkUploadUsers = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState([]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setMessage('Please select a file');
            return;
        }

        setUploading(true);
        setMessage('');
        setErrors([]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await instance.post('/admin/bulk-upload-users', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMessage(response.data.message);
        } catch (error) {
            if (error.response) {
                if (error.response.data.errors) {
                    setErrors(error.response.data.errors);
                }
                setMessage(error.response.data.message || 'Upload failed');
            } else {
                setMessage('Network error. Please try again.');
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Bulk Upload Users</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2" htmlFor="file">
                            Excel File
                        </label>
                        <input
                            type="file"
                            id="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            className="w-full px-3 py-2 border rounded"
                            disabled={uploading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        className={`px-4 py-2 rounded text-white ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {uploading ? 'Uploading...' : 'Upload Users'}
                    </button>
                </form>

                {message && (
                    <div className={`mt-4 p-4 rounded ${errors.length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                {errors.length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 rounded">
                        <h3 className="font-bold mb-2">Errors:</h3>
                        <ul className="list-disc pl-5">
                            {errors.map((error, index) => (
                                <li key={index} className="text-sm">{error}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkUploadUsers;