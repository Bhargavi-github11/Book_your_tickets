import React, { useState } from "react";
import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import Loding from "../components/Loding";
import BlurCircle from "../components/BlurCircle";
import { dateFormat } from "../lib/dateFormat";
import { CreditCardIcon, ShieldCheckIcon, TicketIcon } from "lucide-react";

const Payment = () => {
  const { bookingId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { axios, authToken } = useAppContext();
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY || "₹";
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const sessionId = searchParams.get("session_id");
  const canceled = searchParams.get("canceled");

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

  useEffect(() => {
    if (!canceled) return;
    toast.error("Payment canceled");
    setSearchParams({});
  }, [canceled]);

  const verifyPayment = async (checkoutSessionId) => {
    if (!checkoutSessionId || !authToken) return;

    try {
      setVerifying(true);
      const { data } = await axios.post(
        `/api/booking/verify-payment/${bookingId}`,
        { sessionId: checkoutSessionId },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (data.success) {
        setBooking(data.booking);
        toast.success("Payment successful");
        navigate("/my-bookings", { replace: true });
      } else {
        toast.error(data.message || "Unable to verify payment");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setVerifying(false);
      setSearchParams({});
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    verifyPayment(sessionId);
  }, [sessionId, authToken, bookingId]);

  const onCompletePayment = async () => {
    if (!authToken) {
      toast.error("Please sign in first");
      navigate("/signin");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(`/api/booking/create-checkout-session/${bookingId}`, {}, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.message || "Unable to start payment");
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
              <h1 className="text-2xl font-semibold">Stripe Payment</h1>
              <p className="text-sm text-gray-400">
                Secure checkout powered by Stripe.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-primary/25 bg-black/20 p-4 text-sm text-gray-300">
            Click below to continue on Stripe's hosted checkout page and complete your payment.
          </div>

          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-gray-300 space-y-1">
            <p className="text-white font-medium">Stripe Test Mode (no real card needed)</p>
            <p>Card Number: <span className="text-primary">4242 4242 4242 4242</span></p>
            <p>Expiry: any future date (for example 12/34)</p>
            <p>CVC: any 3 digits (for example 123)</p>
            <p>ZIP/Postal: any valid format</p>
          </div>

          <button
            onClick={onCompletePayment}
            disabled={loading || verifying || booking?.isPaid}
            className="mt-6 w-full py-3 rounded-lg bg-primary hover:bg-primary-dull transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed font-medium"
          >
            {booking?.isPaid ? "Already Paid" : loading || verifying ? "Processing..." : "Pay with Stripe"}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheckIcon className="w-4 h-4 text-primary" />
            <p>Stripe hosted secure checkout</p>
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
