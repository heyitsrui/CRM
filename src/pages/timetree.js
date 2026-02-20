import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/timetree.css';

const API_BASE_URL = 'http://127.0.0.1:5000/api/timetree';
const ROW_HEIGHT = 60; 

const formatDateToISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const parseDbDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.substring(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d); 
};

const TimeTree = () => {
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeEvent, setActiveEvent] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        startTime: '08:00',
        deadline: '',
        deadlineTime: '', // New Field
        date: formatDateToISO(new Date()) 
    });

    const chatEndRef = useRef(null);

    const fetchEvents = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/events`);
            if (data.success) setEvents(data.events);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    const deleteEvent = async (id) => {
        if (!window.confirm("Delete event and chat history?")) return;
        try {
            const { data } = await axios.delete(`${API_BASE_URL}/events/${id}`);
            if (data.success) {
                if (activeEvent?.id === id) setActiveEvent(null);
                fetchEvents();
            }
        } catch (err) {
            alert(err.response?.data?.error || "Delete failed");
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        const timeStr = formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime;
        const dTimeStr = (formData.deadlineTime && formData.deadlineTime.length === 5) ? `${formData.deadlineTime}:00` : formData.deadlineTime;
        
        const payload = { 
            ...formData, 
            startTime: timeStr, 
            deadline_date: formData.deadline || null,
            deadlineTime: dTimeStr || null 
        };

        try {
            const { data } = await axios.post(`${API_BASE_URL}/events`, payload);
            if (data.success) {
                setShowModal(false);
                setFormData({ title: '', startTime: '08:00', deadline: '', deadlineTime: '', date: formatDateToISO(new Date()) });
                fetchEvents();
            }
        } catch (err) {
            alert("Save error: " + (err.response?.data?.error || "Server error"));
        }
    };

    const sendMessage = async (e) => {
        if (e.key === 'Enter' && newMessage.trim() && activeEvent) {
            e.preventDefault();
            const tempMsg = { sender_name: "Kervy", message_text: newMessage };
            setNewMessage("");
            try {
                const { data } = await axios.post(`${API_BASE_URL}/events/${activeEvent.id}/chat`, tempMsg);
                if (data.success) {
                    setActiveEvent(prev => ({ ...prev, chats: [...(prev.chats || []), tempMsg] }));
                    fetchEvents();
                }
            } catch (err) {
                setNewMessage(newMessage);
                alert("Message failed");
            }
        }
    };

    useEffect(() => { fetchEvents(); }, []);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activeEvent?.chats]);

    const changeMonth = (offset) => {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + offset, 1));
    };

    const getMonthDays = () => {
        const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
        const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
        return { firstDay, daysInMonth };
    };

    const getWeekDays = () => {
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        return [...Array(7)].map((_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
        });
    };

    const getEventStyle = (startTime) => {
        if (!startTime) return { display: 'none' };
        const parts = startTime.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const totalMinutes = (hours * 60) + minutes;
        const topOffset = (totalMinutes / 60) * ROW_HEIGHT;

        return { 
            top: `${topOffset}px`, 
            height: `${ROW_HEIGHT}px`, 
            position: 'absolute', 
            zIndex: 10,
            width: '92%',
            left: '4%'
        };
    };

    const { firstDay, daysInMonth } = getMonthDays();
    const currentWeek = getWeekDays();

    return (
        <div className="tt-container">
            <aside className="tt-sidebar-left">
                <button className="btn-create" onClick={() => setShowModal(true)}>＋ Create</button>
                
                <div className="sidebar-month-header">
                    <span className="month-label">{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <div className="month-nav-btns">
                        <button onClick={() => changeMonth(-1)}>&lt;</button>
                        <button onClick={() => changeMonth(1)}>&gt;</button>
                    </div>
                </div>

                <div className="mini-calendar-container">
                    <div className="mini-cal-days-header">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="mini-day-name">{d}</div>)}
                    </div>
                    <div className="mini-cal-grid">
                        {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} />)}
                        {[...Array(daysInMonth)].map((_, i) => (
                            <div key={i} className={`mini-day-num ${selectedDate.getDate() === (i + 1) ? 'active' : ''}`}
                                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1))}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="event-list-sidebar">
                    <h3>Events</h3>
                    {events.map(ev => (
                        <div key={ev.id} className={`sidebar-event-card ${activeEvent?.id === ev.id ? 'active' : ''}`} 
                             onClick={() => { setSelectedDate(parseDbDate(ev.event_date)); setActiveEvent(ev); }}>
                            <div className="sidebar-event-info">
                                <strong>{ev.title}</strong>
                                <div>{ev.start_time?.substring(0, 5)} | {ev.event_date?.substring(0, 10)}</div>
                                {ev.deadline_date && (
                                    <div className="deadline-text">
                                        Due: {ev.deadline_date.substring(0, 10)} 
                                        {ev.deadline_time && ` at ${ev.deadline_time.substring(0, 5)}`}
                                    </div>
                                )}
                            </div>
                            <button className="btn-delete" onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}>Delete</button>
                        </div>
                    ))}
                </div>
            </aside>

            <main className="tt-main">
                <header className="tt-main-header">
                    <div className="gmt-label">GMT+8</div>
                    <div className="week-days">
                        {currentWeek.map((day, i) => (
                            <div key={i} className="day-col-head">
                                <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                <div className={`day-num ${day.toDateString() === selectedDate.toDateString() ? 'active' : ''}`}>
                                    {day.getDate()}
                                </div>
                            </div>
                        ))}
                    </div>
                </header>

                <div className="grid-viewport weekly-layout">
                    <div className="time-labels-column">
                        {[...Array(24)].map((_, i) => <div key={i} className="hour-label-cell">{i}:00</div>)}
                    </div>
                    <div className="days-columns-container">
                        {currentWeek.map((dayDate, i) => (
                            <div key={i} className="day-column">
                                {[...Array(24)].map((_, j) => <div key={j} className="hour-grid-cell" />)}
                                {events.filter(ev => ev.event_date?.substring(0, 10) === formatDateToISO(dayDate)).map(ev => (
                                    <div key={ev.id} className={`event-card ${activeEvent?.id === ev.id ? 'selected' : ''}`} 
                                         style={getEventStyle(ev.start_time)} onClick={() => setActiveEvent(ev)}>
                                        <div className="event-title">{ev.title}</div>
                                        <div className="event-time">{ev.start_time?.substring(0, 5)}</div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {activeEvent && (
                <aside className="tt-sidebar-chat">
                    <div className="chat-header">
                        <span className="chat-header-title">{activeEvent.title}</span>
                        <button onClick={() => setActiveEvent(null)} className="btn-close-chat">✕</button>
                    </div>
                    <div className="chat-messages">
                        {activeEvent.chats?.map((msg, i) => (
                            <div key={i} className={`chat-bubble ${msg.sender_name === "Kervy" ? "me" : "them"}`}>
                                <div className="chat-sender">{msg.sender_name}</div>
                                <div className="chat-text">{msg.message_text}</div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="chat-input-container">
                        <input className="chat-input" placeholder="Message..." value={newMessage} 
                               onChange={(e) => setNewMessage(e.target.value)} onKeyDown={sendMessage} />
                    </div>
                </aside>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>New Event</h3>
                        <form onSubmit={handleCreateSubmit}>
                            <label>Title</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            <label>Start Date</label>
                            <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            <label>Start Time</label>
                            <input type="time" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                            <label>Deadline Date</label>
                            <input type="date" value={formData.deadline} onChange={e => setFormData({ ...formData, deadline: e.target.value })} />
                            <label>Deadline Time</label>
                            <input type="time" value={formData.deadlineTime} onChange={e => setFormData({ ...formData, deadlineTime: e.target.value })} />
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-save">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeTree;
