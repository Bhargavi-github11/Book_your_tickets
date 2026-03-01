import React from 'react'
import { Link } from 'react-router-dom';
const AdminNavbar = () => {
  return (
    <div className='flex items-center justify-between  px-6  md:px-10 h-16 border-b border-gray-300/30'>
        <Link to='/'>
        <p className='text-2xl font-extrabold tracking-tight text-white'>Frame<span className='text-primary'>Flix</span></p>
        </Link>
    </div>
  )
}
export default AdminNavbar;