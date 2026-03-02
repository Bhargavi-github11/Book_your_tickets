import React, { useState } from 'react'
import BlurCircle from './BlurCircle'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DateSelection = ({ dateTime = {}, id }) => {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null);
  const onBookHandler = () =>{
    if(!selected){
      return toast('please select a date')
    }
    navigate(`/movies/${id}/${selected}`)
    scrollTo(0,0)

  }
  return (
    <div id="dateSelect" className="pt-30">
      <div className="flex flex-col md:flex-row items-center justify-between gap-10
        relative p-8 bg-primary/10 border border-primary/20 rounded-lg">

        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle top="100px" right="0px" />

        <div>
          <p className="text-lg font-semibold">Choose Date</p>

          <div className="flex items-center gap-6 text-sm mt-5">
            <ChevronLeftIcon width={28} />

            <span className="grid grid-cols-3 md:flex flex-wrap md:max-w-lg gap-4">
              {Object.keys(dateTime).map(date => (
                <button onClick={()=> setSelected(date)}
                  key={date}
                  className={`flex flex-col items-center justify-center h-14 w-14 rounded cursor-pointer transition ${selected === date ? "bg-primary text-white border border-primary/50 shadow-[0_10px_20px_-12px_rgba(248,69,101,0.85)]" : "border border-primary/70 hover:bg-primary/20"} `}
                >
                  <span>{new Date(date).getDate()}</span>
                  <span>
                    {new Date(date).toLocaleDateString('en-US', {
                      month: 'short',
                    })}
                  </span>
                </button>
              ))}
            </span>

            <ChevronRightIcon width={28} />
          </div>
        </div>

        <button onClick={onBookHandler} className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary-dull transition cursor-pointer font-semibold border border-primary/40 shadow-[0_12px_24px_-12px_rgba(248,69,101,0.8)]">
          Book Now
        </button>
      </div>
    </div>
  )
}

export default DateSelection
