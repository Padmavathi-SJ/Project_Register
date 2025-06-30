import React, { useState } from 'react'
import Admin_Navbar from './Admin_Navbar'
import Header from '../../Header'
import { Outlet } from 'react-router-dom'

function Admin() {

   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    }

    return (
        <div className="flex min-h-screen bg-white">
        <Admin_Navbar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar}/>
        <div className={`transition-all duration-500 flex-1 overflow-y-auto h-screen ${isSidebarOpen ? 'ml-64' : 'ml-24'}`}>
          <Header />
          <div className="p-4">
            <Outlet />
          </div>
        </div>
      </div>
      )
}

export default Admin