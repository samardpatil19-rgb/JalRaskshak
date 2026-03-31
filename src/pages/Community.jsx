import { Calendar, MapPin, Users, TreePine, Bird, Fish, Flower2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { communityEvents, biodiversityData, garbageStats } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Community.css';

const categoryIcons = { Bird: Bird, Reptile: Fish, Flora: Flower2, Mammal: TreePine, Fish: Fish };

const trendIcons = { increasing: TrendingUp, stable: Minus, decreasing: TrendingDown };

const weeklyData = garbageStats.weekLabels.map((day, i) => ({
    day,
    collected: garbageStats.weeklyKg[i],
}));

export default function Community() {
    return (
        <div className="page-container">
            <div className="page-header animate-in">
                <h1>Community & Biodiversity Hub</h1>
                <p>Community engagement, ecological data, and environmental impact tracking</p>
            </div>

            <div className="community-sections">
                {/* Impact Dashboard */}
                <section className="animate-in">
                    <div className="section-title">Environmental Impact</div>
                    <div className="impact-grid">
                        <div className="impact-card">
                            <div className="impact-value" style={{ color: '#fff' }}>{(garbageStats.totalCollectedKg / 1000).toFixed(1)}t</div>
                            <div className="impact-label">Total Collected</div>
                        </div>
                        <div className="impact-card">
                            <div className="impact-value" style={{ color: '#ccc' }}>{(garbageStats.recycledKg / 1000).toFixed(1)}t</div>
                            <div className="impact-label">Recycled</div>
                        </div>
                        <div className="impact-card">
                            <div className="impact-value">{(garbageStats.plasticKg / 1000).toFixed(1)}t</div>
                            <div className="impact-label">Plastic Removed</div>
                        </div>
                        <div className="impact-card">
                            <div className="impact-value" style={{ color: '#999' }}>{(garbageStats.organicKg / 1000).toFixed(1)}t</div>
                            <div className="impact-label">Organic Waste</div>
                        </div>
                    </div>
                </section>

                {/* Weekly Chart */}
                <section className="animate-in" style={{ animationDelay: '0.1s' }}>
                    <div className="section-title">Weekly Collection (kg)</div>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', padding: 20 }}>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="day" stroke="#3a3a3a" fontSize={11} />
                                <YAxis stroke="#3a3a3a" fontSize={11} />
                                <Tooltip contentStyle={{ background: '#131313', border: '1px solid #222', borderRadius: '4px', fontSize: '0.78rem' }} />
                                <Bar dataKey="collected" fill="#888" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Upcoming Events */}
                <section className="animate-in" style={{ animationDelay: '0.12s' }}>
                    <div className="section-title">Upcoming Events</div>
                    <div className="events-grid">
                        {communityEvents.map(e => (
                            <div key={e.id} className="event-card">
                                <div className="event-date"><Calendar size={12} strokeWidth={2} style={{ marginRight: 4 }} />{new Date(e.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                <h4>{e.title}</h4>
                                <p>{e.description}</p>
                                <div className="event-meta">
                                    <span><MapPin size={11} /> {e.location}</span>
                                    <span><Users size={11} /> {e.volunteers} volunteers</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Biodiversity */}
                <section className="animate-in" style={{ animationDelay: '0.15s' }}>
                    <div className="section-title">Biodiversity Census</div>
                    <div className="bio-grid">
                        {biodiversityData.map((b, i) => {
                            const CatIcon = categoryIcons[b.category] || TreePine;
                            const TrendIcon = trendIcons[b.trend] || Minus;
                            return (
                                <div key={i} className="bio-card">
                                    <div className="bio-icon"><CatIcon size={22} strokeWidth={1.5} /></div>
                                    <div className="bio-info">
                                        <h4>{b.species}</h4>
                                        <p>{b.category} · {b.habitat}</p>
                                    </div>
                                    <div className="bio-count">
                                        <span>{b.count}</span>
                                        <span className={`bio-trend ${b.trend === 'increasing' ? 'up' : b.trend === 'stable' ? 'stable' : 'down'}`}>
                                            <TrendIcon size={11} style={{ marginRight: 2 }} /> {b.trend}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
