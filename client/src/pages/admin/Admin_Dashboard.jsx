import React, { useEffect, useState, useMemo } from 'react';
import instance from '../../utils/axiosInstance';

function Admin_Dashboard() {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [teamsRes, projectsRes] = await Promise.all([
          instance.get("/admin/show_team_numbers/"),
          instance.get('/admin/teacher/getprojects')
        ]);
        
        setTeams(teamsRes.data?.data || []);
        setProjects(projectsRes.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load dashboard data");
        setTeams([]);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Safe team counting logic
  const { teamStats, upcoming, activity } = useMemo(() => {
    // Initialize default values
    const result = {
      teamStats: [
        { title: 'Total Teams', value: 0 },
        { title: 'Solo Teams', value: 0 },
        { title: 'Duo Teams', value: 0 },
        { title: 'Trio Teams', value: 0 },
        { title: 'Squad Teams', value: 0 },
      ],
      upcoming: [],
      activity: []
    };

    // Only process if data is loaded and valid
    if (!loading && !error) {
      // Process teams data
      const teamIdCount = {};
      if (Array.isArray(teams)) {
        teams.forEach((team) => {
          const id = team?.team_id;
          if (id) teamIdCount[id] = (teamIdCount[id] || 0) + 1;
        });

        let soloTeams = 0;
        let duoTeams = 0;
        let trioTeams = 0;
        let squadTeams = 0;

        Object.values(teamIdCount).forEach((count) => {
          if (count === 1) soloTeams++;
          else if (count === 2) duoTeams++;
          else if (count === 3) trioTeams++;
          else if (count >= 4) squadTeams++;
        });

        result.teamStats = [
          { title: 'Total Teams', value: soloTeams + duoTeams + trioTeams + squadTeams },
          { title: 'Solo Teams', value: soloTeams },
          { title: 'Duo Teams', value: duoTeams },
          { title: 'Trio Teams', value: trioTeams },
          { title: 'Squad Teams', value: squadTeams },
        ];
      }

      // Process projects data
      if (Array.isArray(projects)) {
        // Upcoming deadlines
        result.upcoming = [...projects]
          .filter((t) => t?.deadline)
          .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
          .slice(0, 2)
          .map((t) => ({ name: t.team_name || 'Unnamed team', deadline: t.deadline }));

        // Recent activity
        result.activity = [...projects]
          .filter((t) => t?.posted_date)
          .sort((a, b) => new Date(b.posted_date) - new Date(a.posted_date))
          .slice(0, 3)
          .map((t) => `Team "${t.project_name || 'Unnamed project'}" was posted on ${new Date(t.posted_date).toLocaleDateString()}.`);
      }
    }

    return result;
  }, [teams, projects, loading, error]);

  if (loading) {
    return <div className="p-6 text-center">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="p-6 rounded-xl h-[90%]">
      <h2 className="text-3xl font-bold flex justify-center mb-8">
        Admin Dashboard
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        {teamStats.map((stat, index) => (
          <div key={index} className="bg-white p-5 rounded-2xl shadow hover:scale-105 transition duration-200">
            <p className="text-sm text-gray-500">{stat.title}</p>
            <h3 className="text-2xl font-semibold text-purple-500">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6 hover:scale-105 transition duration-200">
        <h3 className="text-xl font-semibold mb-4">Upcoming Deadlines</h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          {upcoming.length > 0 ? (
            upcoming.map((item, index) => (
              <li key={index}>
                <span className="font-medium">{item.name}</span> — {item.deadline}
              </li>
            ))
          ) : (
            <p className="text-gray-500">No upcoming deadlines</p>
          )}
        </ul>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-2xl shadow hover:scale-105 transition duration-200">
        <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
        {activity.length > 0 ? (
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            {activity.map((act, index) => (
              <li key={index}>{act}</li>
            ))}
          </ul>
        ) : (
          <p>No recent activity</p>
        )}
      </div>
    </div>
  );
}

export default Admin_Dashboard;