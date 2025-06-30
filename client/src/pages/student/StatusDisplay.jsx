import React, { useEffect, useState } from 'react';
import instance from '../../utils/axiosInstance';
import Select from 'react-select';
import { useSelector } from 'react-redux';
const StatusDisplay = ({ guideStatusList = [], expertStatusList = [], project = {}, getStatus }) => {
    const [expertsList, setExpertsList] = useState([]);
    const [guidesList, setGuidesList] = useState([]);
    const [selectedExperts, setSelectedExperts] = useState([]);
    const [selectedGuides, setSelectedGuides] = useState([]);
    const teamselector = useSelector((State) => State.teamSlice.data || null);
    const userselector = useSelector((state) => state.userSlice.auth.user || null); // Add this line

    console.log(guideStatusList, "guideStatusList");
    console.log(expertStatusList, "expertStatusList");
    // Filtered options to ensure no overlap
    const filteredExpertOptions = expertsList
        .filter(expert => !selectedGuides.includes(expert.reg_num)) // exclude selected guides
        .map((expert) => ({
            value: expert.reg_num,
            label: `${expert.name} (${expert.reg_num})`,
        }));

    const filteredGuideOptions = guidesList
        .filter(guide => !selectedExperts.includes(guide.reg_num)) // exclude selected experts
        .map((guide) => ({
            value: guide.reg_num,
            label: `${guide.name} (${guide.reg_num})`,
        }));


    useEffect(() => {
        async function fetchExpertsAndGuides() {
            try {
                const [expertRes, guideRes] = await Promise.all([
                    instance.get('/admin/get_users/staff', { withCredentials: true }),
                    instance.get('/admin/get_users/staff', { withCredentials: true }),
                ]);
                if (expertRes.status === 200) setExpertsList(expertRes.data.data);
                if (guideRes.status === 200) setGuidesList(guideRes.data.data);
            } catch (err) {
                console.error('Fetch Error:', err);
                alert('Failed to load experts and guides.', err);
            }
        }

        fetchExpertsAndGuides();
    }, []);
    const handleExpertChange = (selectedOptions) => {
        const selectedRegNums = selectedOptions.map(option => option.value);
        setSelectedExperts(selectedRegNums);
    };
    const handleGuideChange = (selectedOptions) => {
        const selectedRegNums = selectedOptions.map(option => option.value);
        setSelectedGuides(selectedRegNums);
    };
    // Custom filter to search by name or reg_num
    const customFilter = (option, inputValue) => {
        const label = option.label.toLowerCase();
        const value = option.value.toLowerCase();
        const search = inputValue.toLowerCase();
        return label.includes(search) || value.includes(search);
    };
    // Custom search filter (search by name or reg_num)
    const customGuideFilter = (option, inputValue) => {
        const label = option.label.toLowerCase();
        const value = option.value.toLowerCase();
        const search = inputValue.toLowerCase();
        return label.includes(search) || value.includes(search);
    };
    const handleSubmit = async (e, type) => {
        e.preventDefault();
        try {
            if (type === 'guide') {
                if (selectedGuides.length === 0) {
                    alert('Please select at least one guide');
                    return;
                }
                await instance.post(`/guide/sent_request_to_guide/${userselector.semester}`, {
                    "from_team_id": teamselector[0].team_id,
                    "project_id": project.project_id,
                    "project_name": project.project_name.trim(),
                    "to_guide_reg_num": selectedGuides,
                });
                setSelectedGuides([]);
            } else if (type === 'expert') {
                // Handle expert submission
                if (selectedExperts.length === 0) {
                    alert('Please select at least one expert');
                    return;
                }
                console.log("from_team_id", teamselector[0].team_id,
                    "project_id", project.project_id,
                    "project_name", project.project_name.trim(),
                    "to_expert_reg_num", selectedExperts,);
                await instance.post(`/sub_expert/sent_request_to_expert/${userselector.semester}`, {
                    "from_team_id": teamselector[0].team_id,
                    "project_id": project.project_id,
                    "project_name": project.project_name.trim(),
                    "to_expert_reg_num": selectedExperts,
                });
                setSelectedExperts([]);

            }
            getStatus();
        } catch (error) {
            console.log(error, "error");
        }
    };
    return (
        <div className="bg-white mt-10 p-6 rounded-lg shadow-sm">
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Guide Status List</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Guide Reg No.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {guideStatusList.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.to_guide_reg_num}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${item.status === 'accept' ? 'bg-green-100 text-green-800' :
                                                item.status === 'reject' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {item.status === 'interested' ? 'pending' : item.status || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reason || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {(guideStatusList.length > 0 && guideStatusList.every(item => item.status === 'reject')) ?
                    (<div className="mb-6 bg-white">
                        <h3 className="text-md bg-white font-medium mb-2">Select Guides:</h3>
                        <form onSubmit={(e) => handleSubmit(e, 'guide')}>

                            <Select
                                options={filteredGuideOptions}
                                isMulti
                                onChange={handleGuideChange}
                                value={filteredGuideOptions.filter(option => selectedGuides.includes(option.value))}
                                placeholder="Select guides..."
                                className="basic-multi-select"
                                classNamePrefix="select"
                                filterOption={customGuideFilter}
                                closeMenuOnSelect={false}  // <-- keep dropdown open after selection
                            />
                            <button
                                type="submit"
                                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                Submit
                            </button>
                        </form>
                    </div>
                    ) : null}
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Expert Status List</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Expert Reg No.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {expertStatusList.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.to_expert_reg_num}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${item.status === 'accept' ? 'bg-green-100 text-green-800' :
                                                item.status === 'reject' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {item.status === 'interested' ? 'pending' : item.status || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.reason || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Subject Experts Dropdown */}
                </div>
                {(expertStatusList.length > 0 && expertStatusList.every(item => item.status === 'reject')) ? (
                    <div className="mb-6 bg-white">
                        <h3 className="text-md bg-white font-medium mb-2">Select Subject Experts:</h3>
                        <form onSubmit={(e) => handleSubmit(e, 'expert')}>

                            <Select
                                options={filteredExpertOptions}
                                isMulti
                                onChange={handleExpertChange}
                                value={filteredExpertOptions.filter(option => selectedExperts.includes(option.value))}
                                placeholder="Select experts..."
                                className="basic-multi-select bg-white"
                                classNamePrefix="select"
                                filterOption={customFilter}
                                closeMenuOnSelect={false}

                            // <-- keep dropdown open after selection
                            />
                            <button
                                type="submit"
                                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                                Submit
                            </button>
                        </form>
                    </div>) : null}

            </div>
        </div>
    );
};

export default StatusDisplay;