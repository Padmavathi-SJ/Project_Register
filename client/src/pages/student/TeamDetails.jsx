import React from 'react';

function TeamDetails({ members, createForm, totalMembers, setIsInviteOpen }) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-5 bg-gray-200 px-4 py-2 rounded-t">
        <div className="font-semibold bg-gray-200">Name</div>
        <div className="font-semibold bg-gray-200">Email</div>
        <div className="font-semibold bg-gray-200 pl-3 ml-14">Register No</div>
        <div className="font-semibold bg-gray-200 ml-20">Department</div>
        <div className="font-semibold text-right bg-gray-200">Action</div>
      </div>

      <div className="space-y-1 bg-grey-500">
        {Array.from({ length: totalMembers }).map((_, idx) => {
          const isCreator = idx === 0;
          const memberData = !isCreator ? members[idx - 1] : null;
          return (
            <div key={idx} className="grid grid-cols-5 items-center bg-white px-4 py-2 rounded shadow ">
              <div className="bg-white">
                {isCreator
                  ? createForm.name
                  : memberData
                  ? memberData.name
                  : '-'}
              </div>

              <div className="text-sm text-gray-600 bg-white w-[18rem]" style={{ wordBreak: 'break-word' }}>
                {isCreator
                  ? createForm.email
                  : memberData
                  ? memberData.email
                  : '-'}
              </div>

              <div className="bg-white pl-3 ml-12" style={{ wordBreak: 'break-word' }}>
                {isCreator
                  ? createForm.registerNumber
                  : memberData
                  ? memberData.registerNumber
                  : '-'}
              </div>

              <div className="bg-white ml-20">
                {isCreator
                  ? createForm.department
                  : memberData
                  ? memberData.department
                  : '-'}
              </div>

              <div className="text-right bg-white">
                {!isCreator && !memberData && (
                  <button
                    onClick={() => setIsInviteOpen(true)}
                    className="px-3 py-1 border border-purple-500 text-purple-500 rounded hover:bg-purple-500 hover:text-white transition"
                  >
                    Invite
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TeamDetails;
