import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import axios from 'axios';
import '../styles/timetree.css';

const TimeTree = () => {
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date(2026, 1, 18)); 
    const [activeEvent, setActiveEvent] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', startTime: '10:00', deadline: '' });
    
    // Create a reference for the chat window
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auto-scroll when activeEvent or messages change
    useEffect(() => {
        scrollToBottom();
    }, [activeEvent, activeEvent?.chats]);

    const fetchEvents = async () => {
        try {
            const res = await axios.get('/api/timetree/events');
            if (res.data.success) {
                setEvents(res.data.events);
                if (activeEvent) {
                    const updated = res.data.events.find(e => e.id === activeEvent.id);
                    if (updated) setActiveEvent(updated);
                }
            }
        } catch (err) { console.error("Error fetching events", err); }
    };

    useEffect(() => {
        fetchEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Helper: Better Date Comparison
    const isSameDay = (dbDateStr, calendarDate) => {
        if(!dbDateStr) return false;
        // Strip everything after T to get just YYYY-MM-DD
        const db = new Date(dbDateStr).toISOString().split('T')[0];
        const cal = calendarDate.toISOString().split('T')[0];
        return db === cal;
    };

    const getWeekDays = (date) => {
        const tempDate = new Date(date);
        const dayOfWeek = tempDate.getDay(); 
        const diff = tempDate.getDate() - dayOfWeek;
        const sunday = new Date(tempDate.setDate(diff));
        return [...Array(7)].map((_, i) => {
            const d = new Date(sunday);
            d.setDate(sunday.getDate() + i);
            return d;
        });
    };

    const currentWeek = getWeekDays(selectedDate);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        
        // Manual Format YYYY-MM-DD
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        let timeStr = formData.startTime; 
        if (timeStr && timeStr.length === 5) timeStr = `${timeStr}:00`; 

        try {
            await axios.post('/api/timetree/events', {
                title: formData.title,
                date: dateStr,
                startTime: timeStr,
                // Ensure empty deadline is null so MariaDB doesn't throw Format Mismatch
                deadline_date: formData.deadline.trim() === "" ? null : formData.deadline
            });
            
            setShowModal(false);
            setFormData({ title: '', startTime: '10:00', deadline: '' });
            fetchEvents(); 
        } catch (err) {
            console.error("SQL Debug:", err.response?.data);
            alert("SQL Error: " + (err.response?.data?.error || "Check Console"));
        }
    };

    const sendMessage = async (e) => {
        if (e.key === 'Enter' && newMessage.trim() && activeEvent) {
            try {
                await axios.post(`/api/timetree/events/${activeEvent.id}/chat`, {
                    sender_name: "Kervy", 
                    message_text: newMessage
                });
                setNewMessage("");
                fetchEvents(); 
            } catch (err) { console.error("Error sending message", err); }
        }
    };

    const getEventStyle = (ev) => {
        const [h, m] = ev.start_time.split(':').map(Number);
        const top = (h * 60) + m; 
        return { top: `${top}px` };
    };

    return (
        <div className="tt-container">
            <aside className="tt-sidebar-left">
                <button className="btn-create" onClick={() => setShowModal(true)}>＋ Create</button>
                <div className="mini-calendar">
                    <div style={{fontWeight: 'bold', fontSize: '14px', marginBottom: '10px'}}>February 2026</div>
                    <div className="calendar-grid">
                        {['S','M','T','W','T','F','S'].map(d => <div key={d} className="day-header">{d}</div>)}
                        {[...Array(28)].map((_, i) => (
                            <div key={i} 
                                className={`day-cell ${selectedDate.getDate() === (i + 1) ? 'active' : ''}`}
                                onClick={() => setSelectedDate(new Date(2026, 1, i + 1))}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="event-list-sidebar">
                    <h3 style={{fontSize: '14px', margin: '20px 0 10px'}}>List of Events</h3>
                    {events.map(ev => (
                        <div key={ev.id} className={`sidebar-event-card ${activeEvent?.id === ev.id ? 'active' : ''}`} 
                            onClick={() => {
                                setSelectedDate(new Date(ev.event_date));
                                setActiveEvent(ev);
                            }}>
                            <strong>{ev.title}</strong>
                            <span>{ev.start_time.substring(0,5)}</span>
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
                                <div className="day-name">{day.toLocaleDateString('en-US', {weekday: 'short'})}</div>
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
                                {[...Array(24)].map((_, j) => <div key={j} className="hour-grid-cell"></div>)}
                                {events.filter(ev => isSameDay(ev.event_date, dayDate)).map(ev => (
                                    <div 
                                        key={ev.id} 
                                        className={`event-card ${activeEvent?.id === ev.id ? 'selected' : ''}`} 
                                        style={getEventStyle(ev)} 
                                        onClick={() => setActiveEvent(ev)}
                                    >
                                        <div className="event-title">{ev.title}</div>
                                        <div className="event-time">{ev.start_time.substring(0,5)}</div>
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
                        <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center'}}>
                            <span style={{fontWeight:'bold', fontSize: '16px'}}>{activeEvent.title}</span>
                            <button onClick={() => setActiveEvent(null)} className="btn-close-chat">✕</button>
                        </div>
                    </div>
                    <div className="chat-messages" style={{ overflowY: 'auto', height: 'calc(100% - 120px)' }}>
                        {activeEvent.chats?.map((msg, i) => (
                            <div key={i} className="chat-bubble">
                                <div className="chat-sender">{msg.sender_name}</div>
                                <div className="chat-text">{msg.message_text}</div>
                            </div>
                        ))}
                        {/* Hidden div to anchor the scroll */}
                        <div ref={chatEndRef} />
                        {(!activeEvent.chats || activeEvent.chats.length === 0) && (
                            <div className="chat-empty">No messages yet.</div>
                        )}
                    </div>
                    <div className="chat-input-container">
                        <input 
                            className="chat-input" 
                            placeholder="Type a message..." 
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)} 
                            onKeyDown={sendMessage} 
                        />
                    </div>
                </aside>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Create New Event</h3>
                        <form onSubmit={handleCreateSubmit}>
                            <label>Title</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                            <label>Start Time</label>
                            <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                            <label>Deadline Date</label>
                            <input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn-save">Save Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeTree;
