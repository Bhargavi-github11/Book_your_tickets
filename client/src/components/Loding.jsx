import React from 'react'
const Loding = () => {
  return (
    <div className='min-h-[70vh] px-6 md:px-16 lg:px-24 pt-28'>
      <div className='max-w-6xl mx-auto'>
        <div className='shimmer h-8 w-56 rounded-md mb-8'></div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className='rounded-xl border border-primary/20 bg-primary/5 p-3'>
              <div className='shimmer h-52 w-full rounded-md'></div>
              <div className='shimmer h-4 w-3/4 rounded mt-4'></div>
              <div className='shimmer h-3 w-1/2 rounded mt-3'></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
export default Loding;