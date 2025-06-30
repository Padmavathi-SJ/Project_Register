import { useState, useEffect } from 'react';
import InviteForm from './InviteForm';
import TeamDetails from './TeamDetails';
import instance from '../../utils/axiosInstance';
import { useSelector, useDispatch } from 'react-redux';
// import { addUser } from '../../utils/userSlice';
import { addTeamMembers } from '../../store/teamSlice';
import { useNavigate } from 'react-router-dom';
import { addTeamStatus } from '../../store/teamStatus';
import axios from 'axios';
import StatusDisplay from './StatusDisplay';
import SelectProjectType from './SelectProjectType';

function Student_Dashboard() {
  const userSlice = useSelector((state) => state.userSlice.auth?.user || null);

  const teamSelector = useSelector((State) => State.teamSlice.data);
  const teamstatusSelector = useSelector((State) => State.teamStatusSlice);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [reInviteOpen, setReInviteOpen] = useState(false);
  const [teamConformationPending, setteamConformationPending] = useState(false);
  const [teamStatus, setTeamStatus] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    registerNumber: '',
    department: '',
  });
  const [timeline, setTimeline] = useState(null);
  const [project, setProject] = useState([]);
  const [deadline, setDeadline] = useState([]);
  const [guideName, setGuideName] = useState('');
  const [expertName, setExpertName] = useState('');
  const [guideStatusList, setGuideStatusList] = useState([]);
  const [expertStatusList, setExpertStatusList] = useState([]);
  console.log(guideStatusList, "teamSelector studentDashboard.jsx");
  // console.log(userSlice, "useSelector studentDashboard.jsx");

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!teamstatusSelector?.data.projectId) return; // Exit if no project_id

      try {
        const response = await instance.get(`/student/get_project_details/${teamstatusSelector?.data.projectId}`);
        // console.log(response);
        setProject(response.data.data.project);
      } catch (error) {
        console.error("Error fetching project details:", error);
      }
    };

    fetchProjectDetails();
  }, [teamstatusSelector?.data.projectId]); // Only run when projectId changes

  useEffect(() => {
    const fetchDeadline = async () => {
      try {
        const res = await instance.get(
          `student/show_upcoming_deadline_weekly_logs_and_timeline/${teamSelector[0]?.team_id}`
        );
        setDeadline(res.data.data.length ? res.data.data : []);
      } catch (error) {
        console.log(error);
      }
    };

    if (teamSelector?.[0]?.team_id) {
      fetchDeadline();
    }
  }, [teamSelector?.[0]?.team_id]); // Only run when team_id changes

  const readableDate = project && project[0] && new Date(project[0].posted_date).toLocaleString();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selector = useSelector((state) => state.userSlice.auth.user || null);

  const departments = [
    'CSE', 'AIDS', 'IT', 'AIML', 'CT', 'AGRI', 'ECE', 'EIE',
    'EEE', 'MECH', 'FT', 'FD'
  ];

  const totalMembersAllowed = 4;

  const isValidEmail = (email) => {
    return email.endsWith('@bitsathy.ac.in');
  };

  const studentInfo = {
    studentId: "S123456",
    email: "alex.johnson@university.edu",
    program: "Computer Science",
    semester: "Fall 2023",
    gpa: 3.7,
    creditsCompleted: 45,
    upcomingAssignments: [
      { name: "Data Structures Project", dueDate: "2023-12-15", course: "CS 201" },
      { name: "Algorithms Quiz", dueDate: "2023-12-18", course: "CS 202" },
    ]
  };

  // Sample team data (between 1 and 4 teams)


  const fetchTimeline = async () => {
    try {
      const response = await instance.get('/admin/get_timelines', {
        withCredentials: true // This is crucial for sending cookies
      });
      if (response.status === 200 && response.data.data.length > 0) {

        const current = new Date();
        const active = response.data.data.find(t => {
          const start = new Date(t.start_date);
          const end = new Date(t.end_date);
          return current >= start && current <= end;
        });
        setTimeline(active || null);
      }
    }
    catch (err) {
      console.error('Failed to fetch timeline:', err);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const handleInviteChange = (e) => {
    const { name, value } = e.target;
    setInviteForm((f) => ({ ...f, [name]: value }));
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(inviteForm.email)) {
      alert('Email must be a valid @bitsathy.ac.in address.');
      return;
    }

    try {
      const response = await instance.post(
        '/student/invite_member',
        {
          ...inviteForm,
          from_reg_num: selector.reg_num,
        }
      );

      if (response.status === 200) {
        setPendingInvitations(prev => [...prev, { ...inviteForm, status: 'pending' }]);
        setInviteForm({ name: '', email: '', registerNumber: '', department: '' });
        setIsInviteOpen(false);
        setReInviteOpen(false);
      }
    } catch (err) {
      console.error("Error sending invite:", err);
    }
  };

  const checkUserStatus = async (reg_num) => {
    try {
      // const token = localStorage.getItem('accessToken');
      // if (!token) {
      //   console.error("Access token is missing");
      //   return;
      // }

      const response = await instance.post(
        '/student/fetch_team_status_and_invitations',
        { "from_reg_num": reg_num },
        { withCredentials: true }
      );

      if (response.status === 200) {
        let { teamConformationStatus, teamMembers, pendingInvitations, teamLeader } = response.data.data;
        setTeamStatus(teamConformationStatus);
        setTeamMembers(teamMembers || []);
        setPendingInvitations(pendingInvitations || []);
        if (teamMembers.length === 0) {
          let res = await instance.get(`/student/check_accepted_status/${reg_num}`, {
            withCredentials: true
          });
          // console.log(res);
          if (res.status === 200 && res.data.data.length > 0) {
            setteamConformationPending(true);
          }
        }

        if (teamMembers.length > 0) {
          teamMembers = [...teamMembers, { teamLeader }];
          dispatch(addTeamMembers(teamMembers));
          dispatch(addTeamStatus(response.data));
        }
      }
    } catch (error) {
      console.error('Error checking team status:', error.response ? error.response.data : error.message);
    }
  };

  const handleConfirmTeam = async () => {
    try {
      const regNum = selector.reg_num;
      const sem = selector.semester;
      const response = await instance.patch(
        '/student/team_request/conform_team',
        {
          name: selector.name,
          emailId: selector.emailId,
          reg_num: selector.reg_num,
          dept: selector.dept,
          from_reg_num: regNum,
          semester: sem,
        },
        { withCredentials: true }
      );
      if (response.status === 200) {
        setTeamStatus(1);
        alert('Team confirmed successfully!');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error confirming team:', error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    if (selector.reg_num) checkUserStatus(selector.reg_num);
  }, [selector.reg_num]);

  const getStatus = async () => {
    console.log(teamSelector?.[0]?.team_id);
    const res1 = await instance.get(`/student/guide_status/${teamSelector?.[0]?.team_id}`);
    console.log(res1, "res1res1");
    if (Array.isArray(res1.data.data.requests) && res1.data.data.requests.length >= 0)
      setGuideStatusList([...res1.data.data.requests]);
    const res2 = await instance.get(`/student/expert_status/${teamSelector?.[0]?.team_id}`);
    // console.log(res2.data.data);
    if (Array.isArray(res2.data.data) && res2.data.data.length >= 0)
      setExpertStatusList(res2.data.data);


  }
  useEffect(() => {
    // if (!userSlice.guide_reg_num || !userSlice.sub_expert_reg_num) return;

    const getNames = async () => {
      try {
        if (userSlice.guide_reg_num) {
          const res1 = await instance.get(`/admin/get_name/${userSlice.guide_reg_num}`);
          // console.log(res1.data.data.name);
          setGuideName(res1.data.data.name);
        }

        if (userSlice.sub_expert_reg_num) {
          const res2 = await instance.get(`/admin/get_name/${userSlice.sub_expert_reg_num}`);
          setExpertName(res2.data.data.name);
        }
        getStatus();
      } catch (error) {
        console.log(error);
      }
    };

    getNames();
  }, [teamSelector?.[0]?.team_id]);

  function handleInviteButton() {
    if (userSlice.project_type === null) {

    }
    setIsInviteOpen(true)
  }

  // if (teamStatus === null) {

  //   return <div className='flex flex-col justify-center items-center '><div className="animate-spin rounded-full  flex self-center h-12 w-12 border-t-4 border-blue-500 border-solid mb-4"></div></div>
  // }

  if (teamStatus === 1) {
    return (
      <div className="min-h-screen  p-6">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl flex justify-center font-bold text-black">Student Dashboard</h1>
          <p className="flex justify-center mt-2 text-lg  text-gray-600">Welcome back, {userSlice.name} !</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Info Card */}
          <div className=" ">
            <div className='bg-white rounded-lg shadow p-6'><h2 className="text-xl font-semibold mb-2 bg-white text-black">Student Information </h2><hr className='mb-4' />
              <div className="space-y-3 bg-white">
                <p className='bg-white'><span className="font-medium bg-white text-gray-700">Name :</span> {userSlice.name}</p>
                <p className='bg-white'><span className="font-medium bg-white text-gray-700">Email :</span> {userSlice.emailId}</p>
                <p className='bg-white'><span className="font-medium bg-white text-gray-700">Register Number :</span> {userSlice.reg_num}</p>
                <p className='bg-white'><span className="font-medium bg-white text-gray-700">Department:</span> {userSlice.dept}</p>
                {userSlice.project_type !== null ? <p className='bg-white'><span className="font-medium bg-white text-gray-700">Project Type:</span> {userSlice.project_type === 'internal' ? 'Internal' : "External"}</p> : null}
                <p className='bg-white'><span className="font-medium bg-white text-gray-700">Guide :</span>{guideName} {teamSelector && userSlice?.guide_reg_num ? userSlice.guide_reg_num : "Not Assigned"}</p>
                <p className='bg-white'><span className="font-medium bg-white text-gray-700">Subject Expert :</span>{expertName} {teamSelector && userSlice?.sub_expert_reg_num ? userSlice.sub_expert_reg_num : "Not Assigned"}</p>
              </div></div>

            <div className="mt-10 bg-white p-6 rounded-lg shadow ">
              <h2 className="text-xl font-semibold mb-2 bg-white text-black">Project Details</h2><hr className='mb-4' />
              {/* {userSlice.project_type === null ? <SelectProjectType /> : null} */}

              <div className="space-y-6 bg-white">
                <div className=" bg-white ">
                  <div className="flex bg-white justify-between items-start mb-1">
                    <ul className='bg-white'>
                      <h3 className="text-lg bg-white font-medium  text-gray-800">  Project Name : {project && project.length > 0 && project[0]?.project_name ? project[0]?.project_name : "Project is not created yet ..."}</h3>
                      <h3 className="text-lg bg-white font-medium text-gray-800">Project Id : {project && project.length > 0 && project[0]?.project_id ? project[0]?.project_id : "Project is not create yet ..."}</h3>
                      <h3 className="text-lg bg-white font-medium text-gray-800">Cluster : {project && project.length > 0 && project[0]?.cluster ? project[0]?.cluster : "Project is not create yet ..."}</h3>
                      <h3 className="text-lg bg-white font-medium text-gray-800">Outcome : {project && project.length > 0 && project[0]?.outcome ? project[0]?.outcome : "Project is not create yet ..."}</h3>
                      <h3 className="text-lg bg-white font-medium text-gray-800">Project Picked Date : {readableDate ? readableDate : "Project is not created yet ..."}</h3>
                    </ul>
                  </div>


                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-2 space-y-6">
            {/* Upcoming Assignments */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-black bg-white">Upcoming Deadline</h2>
              <hr className='mb-4' />

              <div className="space-y-4 bg-white">
                <div className="border-l-4 bg-white border-blue-500 pl-4 py-2">
                  <h3 className="font-medium bg-white text-gray-800">
                    {deadline && (deadline[0]?.current_week_name || null)}
                  </h3>
                  <p className="text-md text-gray-600 bg-white">
                    Deadline: {(deadline[0] && deadline[0]?.current_week_deadline) ? new Date(deadline[0]?.current_week_deadline).toLocaleDateString() : "Not Assigned"}
                  </p>
                </div>
                <div className="border-l-4 bg-white border-blue-500 pl-4 py-2">
                  <h3 className="font-medium bg-white text-gray-800">
                    {deadline[0]?.current_timeline}
                  </h3>
                  <p className="text-md text-gray-600 bg-white">
                    Open date: {(deadline[0] && deadline[0]?.timeline_start_date) ? new Date(deadline?.[0]?.timeline_start_date).toLocaleDateString() : "Not Assigned"}
                  </p>
                  <p className="text-md text-gray-600 bg-white">
                    Deadline: {(deadline[0] && deadline[0]?.timeline_end_date) ? new Date(deadline?.[0]?.timeline_end_date).toLocaleDateString() : "Not Assigned"}
                  </p>
                </div>
              </div>
            </div>


            {/* Teams Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4  text-black bg-white">Your Teams</h2><hr className='mb-4' />
              <div className="space-y-6 bg-white">
                <div className=" rounded-lg bg-white p-4">
                  <h4 className="font-medium text-gray-700 bg-white mb-2">
                    Team ID: <span className="text-blue-500 bg-white font-semibold">{teamSelector && teamSelector[0]?.team_id}</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2  bg-white gap-4">

                    {/* Check if leader exists */}
                    {teamSelector.length > 0 && teamSelector[teamSelector.length - 1].teamLeader && (() => {
                      const leader = teamSelector[teamSelector.length - 1].teamLeader;

                      return (
                        <div key="team-leader" className="flex items-start space-x-4 bg-yellow-100 p-3 rounded shadow-sm">
                          <div className="h-10 w-10 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-700 font-bold text-lg">
                            {leader.name.charAt(0)}
                          </div>
                          <div className='bg-yellow-100'>
                            <p className="text-sm bg-yellow-100 font-semibold text-yellow-900">{leader.name}</p>
                            <p className="text-xs bg-yellow-100 text-yellow-700 font-semibold">Team Leader</p>
                            <p className="text-xs bg-yellow-100 text-yellow-800 mt-1">Reg No: {leader.reg_num}</p>
                            <p className="text-xs bg-yellow-100 text-yellow-800">Email: {leader.emailId}</p>
                            <p className="text-xs bg-yellow-100 text-yellow-800">Dept: {leader.dept}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Render all members except the leader */}
                    {teamSelector.map((member, idx) => {
                      if (!member || !member.name) return null;

                      const leader = teamSelector[teamSelector.length - 1].teamLeader;

                      // Skip member if reg_num equals leader's reg_num
                      if (leader && member.reg_num === leader.reg_num) return null;

                      return (
                        <div key={`member-${idx}-1`} className="flex items-start space-x-4 bg-blue-100 p-3 rounded shadow-sm">
                          <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                            {member.name.charAt(0)}
                          </div>
                          <div className='bg-blue-100'>
                            <p className="text-sm font-semibold bg-blue-100 text-gray-800">{member.name}</p>
                            <p className="text-xs bg-blue-100 text-gray-500">Team Member</p>
                            <p className="text-xs bg-blue-100 text-gray-600 mt-1">Reg No: {member.reg_num}</p>
                            <p className="text-xs bg-blue-100 text-gray-600">Email: {member.emailId}</p>
                            <p className="text-xs bg-blue-100 text-gray-600">Dept: {member.dept}</p>
                          </div>
                        </div>
                      );
                    })}

                  </div>
                </div>


              </div>

            </div>

          </div>
        </div>
        {
          (project && project.length > 0) && project[0]?.project_id ? <StatusDisplay
            guideStatusList={guideStatusList}
            expertStatusList={expertStatusList}
            project={project && project[0] ? project[0] : null}
            getStatus={getStatus}
          /> : null
        }


      </div>
    );
  }

  if (teamConformationPending) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h1 className="text-3xl font-bold text-yellow-600">
          Team Confirmation Pending by Your Team Leader
        </h1>
      </div>
    );
  }

  const acceptedMembers = teamMembers.filter(member => member.status === 'accept');
  const remainingInvites = totalMembersAllowed - (1 + pendingInvitations.length + acceptedMembers.length);
  // ...rest of your imports and code...

  return (
    <div className="min-h-screen flex flex-col items-center px-6 pt-16">
      <div className="w-full relative flex justify-end items-center -mt-12 mb-6">
        <h2 className="absolute text-2xl left-1/2 transform -translate-x-1/2 font-bold text-black">
          Your Team
        </h2>
        <button
          className="px-4 py-2 border border-purple-500 text-white bg-purple-500 rounded hover:bg-purple-600"
          onClick={() => navigate('/student/invitations')}
        >
          Invitations
        </button>
      </div>

      <div className="w-[95%] max-w-[60rem] rounded-xl flex flex-col items-center gap-4 p-3 overflow-y-auto">
        <div className="border w-full p-4 bg-white rounded-xl">
          <p className=' bg-white '><strong className=' bg-white '>Name:</strong> {selector.name}</p>
          <p className=' bg-white '><strong className=' bg-white '>Email:</strong> {selector.emailId}</p>
          <p className=' bg-white '><strong className=' bg-white '>Register Number:</strong> {selector.reg_num}</p>
          <p className=' bg-white '><strong className=' bg-white '>Department:</strong> {selector.dept}</p>
          {userSlice && userSlice.project_type === null && (
            <div className="w-full max-w-4xl mx-auto mt-6">
              <SelectProjectType />
            </div>
          )}

        </div>

        {acceptedMembers.map((member, idx) => (
          <div key={idx} className="border w-full p-4 rounded-xl bg-gray-50">
            <p className=' bg-white '><strong className=' bg-white '>Name:</strong> {member.name}</p>
            <p className=' bg-white '><strong className=' bg-white '>Email:</strong> {member.emailId}</p>
            <p className=' bg-white '><strong className=' bg-white '>Register Number:</strong> {member.reg_num}</p>
            <p className=' bg-white '><strong className=' bg-white '>Department:</strong> {member.dept}</p>
            <p className="text-green-500 bg-white font-semibold">Status: Accepted</p>
          </div>
        ))}

        {pendingInvitations.map((invitation, idx) => (
          <div key={idx} className="border w-full p-4 rounded-xl bg-gray-50">
            <p className=' bg-white '><strong className=' bg-white '>Name:</strong> {invitation.name}</p>
            <p className=' bg-white '><strong className=' bg-white '>Email:</strong> {invitation.emailId}</p>
            <p className=' bg-white '><strong className=' bg-white '>Register Number:</strong> {invitation.reg_num}</p>
            <p className=' bg-white '><strong className=' bg-white '>Department:</strong> {invitation.dept}</p>
            <p className={`font-semibold  bg-white  ${invitation.status === 'accept' ? 'text-green-500' :
              invitation.status === 'reject' ? 'text-red-500' :
                'text-yellow-500'
              }`}>
              Status: {
                invitation.status === 'accept'
                  ? invitation.status
                  : invitation.status === 'reject'
                    ? `${invitation.status} (${invitation.reason})`
                    : 'pending'
              }

            </p>
          </div>
        ))}
        <div className='flex gap-40'>
          {(acceptedMembers.length + 1 < totalMembersAllowed) && timeline && (
            <button
              onClick={handleInviteButton}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Invite Member
            </button>
          )}

          {(acceptedMembers.length + 1 >= 1 && teamStatus !== 1 && timeline && userSlice.project_type !== null) && (
            <button
              onClick={handleConfirmTeam}
              className="px-4 py-2 bg-green-600 text-white rounded "
            >
              Confirm Team
            </button>

          )}
        </div>
      </div>

      {isInviteOpen && (
        <InviteForm
          {...{ inviteForm, handleInviteChange, handleInviteSubmit, departments, setIsInviteOpen }}
        />
      )}

      {!timeline && (
        <p className="text-red-500 font-medium mt-4">
          Team creation is currently disabled. Please wait for the official schedule.
        </p>
      )}
    </div>
  );

}

export default Student_Dashboard;
