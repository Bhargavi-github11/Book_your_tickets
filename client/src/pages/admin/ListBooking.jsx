import React, { useEffect, useState } from 'react'
import Loding from '../../components/Loding';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';
const ListBooking = () => {
  const currency = import.meta.env.VITE_CURRENCY
  const { axios, authToken, navigate } = useAppContext()

  const [bookings, setBookings] = useState([]);
  const [isLoading, setLoading] = useState(true);

  const getAllBookings = async () => {
    if (!authToken) {
      navigate('/signin', { state: { from: '/admin/list-bookings' } })
      return
    }

    try {
      const { data } = await axios.get('/api/admin/all-bookings', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (data.success) {
        setBookings(Array.isArray(data.bookings) ? data.bookings : [])
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        navigate('/')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{
    getAllBookings()
  }, [authToken])

  return !isLoading ? (
    <>
    <Title text1="List"  text2="Bookings" />
    <div className='max-w-4xl mt-6 overflow-x-auto'>
      <table className='w-full border-collapse rounded-md overflow-hidden text-nowrap'>
        <thead>
          <tr className='bg-primary/20 text-left text-white'>
            <th className='p-2 font-medium pl-5'>User Name</th>
            <th className='p-2 font-medium'>Movie Name</th>
            <th className='p-2 font-medium'>Show Time</th>
            <th className='p-2 font-medium'>Seats</th>
            <th className='p-2 font-medium'>Amount</th>
          </tr>
        </thead> 
        <tbody className='text-sm font-light'>
          {bookings.map((item, index)=>(
            <tr key={index} className='border-b border-primary/20 bg-primary/5 even:bg-primary/10'>
              <td className='p-2 min-w-45 pl-5'>{item.user?.name || 'Unknown'}</td>
              <td className='p-2'>{item.show?.movie?.title || 'N/A'}</td>
              <td className='p-2'>{item.show?.showDateTime ? dateFormat(item.show.showDateTime) : 'N/A'}</td>
              <td className='p-2'>{Array.isArray(item.bookedSeats) ? item.bookedSeats.join(', ') : ''}</td>
              <td className='p-2'>{currency} {item.amount}</td>
            </tr>
          ))}
          
          </tbody> 
      </table>
    </div>
    </>
  ) : <Loding />
}
export default ListBooking;