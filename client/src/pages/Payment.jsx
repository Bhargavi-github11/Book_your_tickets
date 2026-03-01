import React, { useState } from "react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import Loding from "../components/Loding";
import BlurCircle from "../components/BlurCircle";
import { dateFormat } from "../lib/dateFormat";
import { CreditCardIcon, ShieldCheckIcon, TicketIcon } from "lucide-react";

const Payment = () => {
  const { bookingId } = useParams();
  const { axios, authToken } = useAppContext();
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY || "₹";
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const fetchBooking = async () => {
    if (!authToken) {
      navigate("/signin", { state: { from: `/payment/${bookingId}` } });
      return;
    }

    try {
      const { data } = await axios.get(`/api/booking/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (data.success) {
        setBooking(data.booking);
      } else {
        toast.error(data.message || "Booking not found");
        navigate("/my-bookings");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
      navigate("/my-bookings");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [authToken, bookingId]);

  const onCompletePayment = async () => {
    if (!authToken) {
      toast.error("Please sign in first");
      navigate("/signin");
      return;
    }

    if (!cardName.trim() || cardNumber.replace(/\s/g, "").length < 12 || !expiry.trim() || cvv.length < 3) {
      toast.error("Please fill card details to continue");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(
        `/api/booking/pay/${bookingId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (data.success) {
        toast.success("Payment successful");
        navigate("/my-bookings");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <Loding />;

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-6">
        <p className="text-gray-300">Unable to load booking details.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-6 md:px-16 lg:px-24 pt-28 pb-14">
      <BlurCircle top="140px" left="80px" />
      <BlurCircle top="340px" left="70%" />

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl border border-primary/30 bg-primary/10 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <CreditCardIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Dummy Payment</h1>
              <p className="text-sm text-gray-400">
                This is a demo payment screen. Click below to complete payment.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-300">Cardholder Name</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Doe"
                className="mt-1 w-full rounded-lg bg-black/20 border border-primary/30 px-3 py-2.5 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-300">Card Number</label>
              <input
                type="text"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/[^\d\s]/g, ""))}
                placeholder="4242 4242 4242 4242"
                className="mt-1 w-full rounded-lg bg-black/20 border border-primary/30 px-3 py-2.5 outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">Expiry</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                className="mt-1 w-full rounded-lg bg-black/20 border border-primary/30 px-3 py-2.5 outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300">CVV</label>
              <input
                type="password"
                maxLength={4}
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                placeholder="123"
                className="mt-1 w-full rounded-lg bg-black/20 border border-primary/30 px-3 py-2.5 outline-none"
              />
            </div>
          </div>

          <button
            onClick={onCompletePayment}
            disabled={loading || booking?.isPaid}
            className="mt-6 w-full py-3 rounded-lg bg-primary hover:bg-primary-dull transition disabled:opacity-60 font-medium"
          >
            {booking?.isPaid ? "Already Paid" : loading ? "Processing..." : "Pay Now"}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheckIcon className="w-4 h-4 text-primary" />
            <p>Dummy secure checkout for demo use only</p>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-primary/30 bg-primary/8 p-6 h-fit">
          <div className="flex items-center gap-2 text-primary">
            <TicketIcon className="w-5 h-5" />
            <p className="font-medium">Booking Summary</p>
          </div>

          <img
            src={booking.show?.movie?.poster_path}
            alt={booking.show?.movie?.title}
            className="mt-4 rounded-lg w-full h-52 object-cover"
          />

          <div className="mt-4 space-y-2 text-sm text-gray-300">
            <p className="text-white font-medium text-base">{booking.show?.movie?.title}</p>
            <p>Booking ID: <span className="text-white break-all">{bookingId}</span></p>
            <p>Show Time: <span className="text-white">{dateFormat(booking.show?.showDateTime)}</span></p>
            <p>Seats: <span className="text-white">{Array.isArray(booking.bookedSeats) ? booking.bookedSeats.join(", ") : "N/A"}</span></p>
            <p className="pt-2 text-lg text-white font-semibold">Total: {currency}{booking.amount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
