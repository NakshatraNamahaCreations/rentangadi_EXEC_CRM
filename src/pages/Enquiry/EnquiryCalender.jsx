import React, { useState, useEffect, useMemo } from "react";
import { Card, Container } from "react-bootstrap";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ApiURL } from "../../api";


const localizer = momentLocalizer(moment);

const EnquiryCalender = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);

  // Fetch from API
  useEffect(() => {
    const fetchEnquiry = async () => {
      try {
        const res = await axios.get(`${ApiURL}/Enquiry/getallEnquiry`);
        if (res.status === 200) {
          setEnquiries(res.data.enquiryData || []);
        }
      } catch (error) {
        console.error("Error fetching enquiry data:", error);
      }
    };
    fetchEnquiry();
  }, []);

  // Group enquiries by date (DD-MM-YYYY)
  const enquiriesCountByDate = useMemo(() => {
    const map = {};
    enquiries.forEach((enq) => {
      // enq.enquiryDate is DD-MM-YYYY
      const [dd, mm, yyyy] = (enq.enquiryDate || "").split("-");
      if (!dd || !mm || !yyyy) return;
      const dateKey = `${yyyy}-${mm}-${dd}`; // for Date parsing
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(enq);
    });
    return map;
  }, [enquiries]);

  // Calendar events: one per date
  const calendarEvents = Object.entries(enquiriesCountByDate).map(
    ([date, enqs]) => ({
      title: `Enquiries: ${enqs.length}`,
      start: new Date(date),
      end: new Date(date),
      allDay: true,
      enquiries: enqs,
      date,
    })
  );

  // Color events
  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: "#BD5525",
      color: "white",
      borderRadius: "4px",
      border: "none",
    },
  });

  // On event click, go to /enquiries-by-date/:date and pass data
  const handleCalendarEventClick = (event) => {
    // Convert YYYY-MM-DD to DD-MM-YYYY
    const [yyyy, mm, dd] = event.date.split("-");
    const ddmmyyyy = `${dd}-${mm}-${yyyy}`;
    const enquiriesForDate = (enquiriesCountByDate[event.date] || []);
    navigate(`/enquiries-by-date/${ddmmyyyy}`, {
      state: { date: ddmmyyyy, enquiries: enquiriesForDate },
    });
  };

  return (
    <Container className="my-4">
      <Card className="shadow-sm">
        <Card.Body>
          <div style={{ minHeight: 500 }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              views={["month", "week", "day", "agenda"]}
              popup
              selectable
              onSelectEvent={handleCalendarEventClick}
              eventPropGetter={eventStyleGetter}
            />
          </div>
          <div style={{ fontSize: 13, marginTop: 16, color: "#888" }}>
            <b>Note:</b> Click on a calendar event to view all enquiries for that day.
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EnquiryCalender;