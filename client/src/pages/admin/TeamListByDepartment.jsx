import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function TeamListByDepartment() {
  const { department } = useParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/student/projects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: "include",
          body: JSON.stringify({ departments: [department] }),
        });

        if (!res.ok) throw new Error("Failed to fetch project data");
        const data = await res.json();
        console.log("Fetched projects:", data);
        setProjects(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (department) fetchProjects();
  }, [department]);

  if (loading) return <p className="text-center mt-10">Loading data...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">Error: {error}</p>;

  // Filter only 'ongoing' projects
  const ongoingProjects = projects.filter((project) => project.status === 'ongoing');

  if (!ongoingProjects.length)
    return <p className="text-center mt-10">No ongoing projects found for {department}</p>;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700">
        Ongoing Projects in {department}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ongoingProjects.map((project, index) => (
          <Link
            to={`/admin/team_progress/${project.project_id}`}
            key={index}
            className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-2xl hover:scale-[1.02] transition-transform duration-300 border border-gray-200"
          >
            <h2 className="text-xl font-bold text-indigo-600 mb-2">{project.project_name}</h2>
            <p className="text-sm text-gray-700 mb-2">{project.description}</p>
            <p className="text-xs text-gray-500 mb-4">Project ID: {project.project_id}</p>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Phase 1:</strong> {project.phase_1_requirements}</p>
              <p><strong>Phase 2:</strong> {project.phase_2_requirements}</p>
              <p><strong>Phase 3:</strong> {project.phase_3_requirements}</p>
              <p><strong>Phase 4:</strong> {project.phase_4_requirements}</p>
              <p><strong>Phase 5:</strong> {project.phase_5_requirements}</p>
              {project.phase_6_requirements && (
                <p><strong>Phase 6:</strong> {project.phase_6_requirements}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
