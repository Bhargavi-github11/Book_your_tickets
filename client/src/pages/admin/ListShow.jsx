import React, { useEffect, useState } from 'react'
import Loding from '../../components/Loding';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
const ListShow = () => {
  const currency = import.meta.env.VITE_CURRENCY
  const { axios, authToken, navigate } = useAppContext()
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true)

  const getAllShows = async () =>{
    try{
      if (!authToken) {
        navigate('/signin', { state: { from: '/admin/list-shows' } })
        return
      }

      const { data } = await axios.get('/api/admin/all-shows', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (data.success) {
        setShows(Array.isArray(data.shows) ? data.shows : [])
      } else {
        toast.error(data.message)
      }
    }catch(error){
      toast.error(error?.response?.data?.message || error.message)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        navigate('/')
      }
    } finally {
      setLoading(false);
    }  
  }

  useEffect(() => {
    getAllShows()
  }, [authToken])
  return ! loading ? (
    <>
    <Title text1="List" text2="shows" />
    <div className='max-w-4xl mt-6 overflow-x-auto'>
      <table className='w-full border-collapse rounded-md overflow-hidden text-nowrap'>
        <thead>
          <tr className='bg-primary/20 text-left text-white'>
          <th className='p-2 font-medium pl-5'>Movie Name</th>
          <th className='p-2 font-medium'>Show Time</th>
          <th className='p-2 font-medium'>Total Bookings</th>
          <th className='p-2 font-medium'>Earnings</th>
        </tr>
        </thead>
        <tbody className='text-sm font-light'>
          {shows.map((show, index)=>(
            <tr key={index} className='border-b border-primary/10 bg-primary/5 even:bg-primary/10'>
              <td className='p-2 min-w-45 pl-5'>{show.movie?.title || 'N/A'}</td>
              <td className='p-2'>{dateFormat(show.showDateTime)}</td>
              <td className='p-2'>{Object.keys(show.occupiedSeats || {}).length}</td>
              <td className='p-2'>{currency} {Object.keys(show.occupiedSeats || {}).length * show.showPrice}</td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
    </>
  ) : <Loding />
}
export default ListShow;