import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function Admin_project_details() {
  const { project_id } = useParams();
  const [teamDetails, setTeamDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTeamDetails() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/student/get_progress_by_project_id/${project_id}`);
        if (!res.ok) throw new Error("Failed to fetch team details");
        const data = await res.json();
        console.log("Fetched team data:", data);
        setTeamDetails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (project_id) fetchTeamDetails();
  }, [project_id]);

  if (loading) return <p>Loading team details...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!teamDetails || teamDetails.length === 0) return <p>No team details found for project ID {project_id}</p>;

  return (
    <div>
      <h2>Team Details for Project ID: {project_id}</h2>
      {teamDetails.map((team, index) => (
        <div key={index} style={{ border: '1px solid gray', margin: '10px', padding: '10px' }}>
          <p><strong>Team ID:</strong> {team.team_id}</p>
          <p><strong>Project Name:</strong> {team.project_name}</p>
          <p><strong>Department:</strong> {team.department}</p>
          <p><strong>Team Leader:</strong> {team.team_leader_name}</p>
          {/* Add any other fields from team_requests table */}
        </div>
      ))}
    </div>
  );
}
