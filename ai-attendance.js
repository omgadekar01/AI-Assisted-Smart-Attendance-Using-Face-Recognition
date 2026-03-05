// ===== AI ATTENDANCE ANALYTICS ENGINE =====
// Smart analytics, predictions, and intelligent insights

class AIAttendanceEngine {
    constructor() {
        this.predictions = {};
        this.anomalies = [];
        this.trends = {};
        this.recommendations = {};
    }

    // ===== PREDICTION ENGINE =====
    // Predict future attendance patterns
    predictAttendance(student) {
        const history = student.attendance || [];
        if (history.length < 3) return null;

        const lastDays = history.slice(-7); // Last 7 records
        const presentCount = lastDays.filter(a => a.present).length;
        const attendanceRate = presentCount / lastDays.length;

        // Simple moving average prediction
        const prediction = {
            studentId: student.id,
            studentName: student.name,
            historicalRate: (presentCount / lastDays.length * 100).toFixed(2),
            predictedPresent: attendanceRate >= 0.75 ? 'High' : attendanceRate >= 0.5 ? 'Medium' : 'Low',
            confidenceScore: (Math.abs(attendanceRate - 0.5) * 200).toFixed(2) + '%',
            riskLevel: attendanceRate < 0.5 ? 'High Risk' : attendanceRate < 0.75 ? 'Medium Risk' : 'Low Risk',
            trendDirection: this.calculateTrend(lastDays),
            nextWeekProbability: (attendanceRate * 100).toFixed(2) + '%'
        };

        return prediction;
    }

    // Calculate trend direction
    calculateTrend(history) {
        if (history.length < 2) return 'Insufficient Data';
        
        const firstHalf = history.slice(0, Math.floor(history.length / 2));
        const secondHalf = history.slice(Math.floor(history.length / 2));
        
        const firstRate = (firstHalf.filter(a => a.present).length / firstHalf.length) || 0;
        const secondRate = (secondHalf.filter(a => a.present).length / secondHalf.length) || 0;
        
        if (secondRate > firstRate + 0.1) return '📈 Improving';
        if (secondRate < firstRate - 0.1) return '📉 Declining';
        return '➡️ Stable';
    }

    // ===== ANOMALY DETECTION =====
    // Detect unusual attendance patterns
    detectAnomalies(registeredStudents) {
        this.anomalies = [];

        registeredStudents.forEach(student => {
            const history = student.attendance || [];
            if (history.length < 5) return;

            // Pattern 1: Sudden absence spike
            if (history.length >= 3) {
                const recent = history.slice(-3);
                const recentAbsent = recent.filter(a => !a.present).length;
                if (recentAbsent === 3) {
                    this.anomalies.push({
                        type: '🚨 Sudden Absence Spike',
                        studentName: student.name,
                        severity: 'High',
                        description: '3 consecutive absences detected',
                        action: 'Send parent notification'
                    });
                }
            }

            // Pattern 2: Inconsistent pattern (alternating present/absent)
            const lastFive = history.slice(-5);
            const pattern = lastFive.map(a => a.present ? 1 : 0).join('');
            if (pattern.match(/10101|01010/)) {
                this.anomalies.push({
                    type: '⚠️ Irregular Attendance Pattern',
                    studentName: student.name,
                    severity: 'Medium',
                    description: 'Inconsistent attendance - alternating pattern detected',
                    action: 'Schedule counseling session'
                });
            }

            // Pattern 3: Weekend-specific absences
            const weekendAbsences = history.filter(a => {
                const date = new Date(a.date);
                return (date.getDay() === 0 || date.getDay() === 6) && !a.present;
            });
            
            if (weekendAbsences.length > history.length * 0.5) {
                this.anomalies.push({
                    type: '📅 Weekend Avoidance Pattern',
                    studentName: student.name,
                    severity: 'Low',
                    description: 'Frequent weekend absences noted',
                    action: 'Monitor scheduling patterns'
                });
            }
        });

        return this.anomalies;
    }

    // ===== INTELLIGENT RECOMMENDATIONS =====
    generateRecommendations(registeredStudents) {
        this.recommendations = {};

        registeredStudents.forEach(student => {
            const predictions = this.predictAttendance(student);
            if (!predictions) return;

            const recommendations = [];

            // Risk-based recommendations
            if (predictions.riskLevel === 'High Risk') {
                recommendations.push({
                    priority: '🔴 Critical',
                    action: 'Schedule immediate parent meeting',
                    impact: 'Address root causes of absenteeism',
                    timeline: 'This week'
                });
                recommendations.push({
                    priority: '🔴 Critical',
                    action: 'Assign academic support',
                    impact: 'Prevent falling behind in studies',
                    timeline: 'Immediately'
                });
            } else if (predictions.riskLevel === 'Medium Risk') {
                recommendations.push({
                    priority: '🟡 Important',
                    action: 'Send reminder emails to parents',
                    impact: 'Increase awareness of attendance',
                    timeline: 'Next 2 weeks'
                });
                recommendations.push({
                    priority: '🟡 Important',
                    action: 'Monitor closely next week',
                    impact: 'Catch early warning signs',
                    timeline: 'Ongoing'
                });
            } else {
                recommendations.push({
                    priority: '🟢 Positive',
                    action: 'Recognize good attendance',
                    impact: 'Encourage continued excellence',
                    timeline: 'Monthly recognition'
                });
                recommendations.push({
                    priority: '🟢 Positive',
                    action: 'Consider for leadership role',
                    impact: 'Utilize consistent student as model',
                    timeline: 'Next semester'
                });
            }

            this.recommendations[student.id] = {
                studentName: student.name,
                predictions: predictions,
                recommendations: recommendations
            };
        });

        return this.recommendations;
    }

    // ===== ATTENDANCE INSIGHTS =====
    getDetailedInsights(registeredStudents) {
        const insights = {
            classStats: this.calculateClassStats(registeredStudents),
            topPerformers: this.identifyTopPerformers(registeredStudents),
            atRiskStudents: this.identifyAtRiskStudents(registeredStudents),
            bestAttendanceDay: this.findBestAttendanceDay(registeredStudents),
            weeklyTrends: this.calculateWeeklyTrends(registeredStudents),
            predictions: this.generateBulkPredictions(registeredStudents)
        };

        return insights;
    }

    // Calculate class-wide statistics
    calculateClassStats(registeredStudents) {
        const totalStudents = registeredStudents.length;
        const totalAttendanceRecords = registeredStudents.reduce((sum, s) => sum + (s.attendance?.length || 0), 0);
        const totalPresent = registeredStudents.reduce((sum, s) => sum + (s.attendance?.filter(a => a.present).length || 0), 0);

        return {
            totalStudents: totalStudents,
            totalRecords: totalAttendanceRecords,
            classAverage: totalAttendanceRecords > 0 ? ((totalPresent / totalAttendanceRecords) * 100).toFixed(2) + '%' : '0%',
            todayPresent: registeredStudents.reduce((sum, s) => {
                const today = new Date().toLocaleDateString();
                return sum + (s.attendance?.filter(a => a.date === today && a.present).length || 0);
            }, 0),
            todayAbsent: registeredStudents.reduce((sum, s) => {
                const today = new Date().toLocaleDateString();
                return sum + (s.attendance?.filter(a => a.date === today && !a.present).length || 0);
            }, 0)
        };
    }

    // Identify top performers
    identifyTopPerformers(registeredStudents) {
        return registeredStudents
            .map(student => ({
                name: student.name,
                id: student.id,
                rate: student.attendance?.length > 0 ? ((student.attendance.filter(a => a.present).length / student.attendance.length) * 100).toFixed(2) : 0
            }))
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 5)
            .map((s, i) => ({...s, rank: i + 1, badge: '⭐'.repeat(5 - i)}));
    }

    // Identify at-risk students
    identifyAtRiskStudents(registeredStudents) {
        return registeredStudents
            .map(student => ({
                name: student.name,
                id: student.id,
                rate: student.attendance?.length > 0 ? ((student.attendance.filter(a => a.present).length / student.attendance.length) * 100).toFixed(2) : 0
            }))
            .filter(s => s.rate < 75)
            .sort((a, b) => a.rate - b.rate)
            .slice(0, 5)
            .map((s, i) => ({...s, riskIndicator: s.rate < 50 ? '🔴' : '🟡'}));
    }

    // Find best attendance day
    findBestAttendanceDay(registeredStudents) {
        const dayStats = {};
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        registeredStudents.forEach(student => {
            (student.attendance || []).forEach(record => {
                const date = new Date(record.date);
                const dayName = days[date.getDay()];
                
                if (!dayStats[dayName]) dayStats[dayName] = { present: 0, total: 0 };
                dayStats[dayName].total++;
                if (record.present) dayStats[dayName].present++;
            });
        });

        let bestDay = null;
        let bestRate = -1;

        Object.entries(dayStats).forEach(([day, stats]) => {
            const rate = stats.total > 0 ? stats.present / stats.total : 0;
            if (rate > bestRate) {
                bestRate = rate;
                bestDay = { day, rate: (rate * 100).toFixed(2) + '%' };
            }
        });

        return bestDay || { day: 'N/A', rate: '0%' };
    }

    // Calculate weekly trends
    calculateWeeklyTrends(registeredStudents) {
        const weeks = {};
        
        registeredStudents.forEach(student => {
            (student.attendance || []).forEach(record => {
                const date = new Date(record.date);
                const weekNum = Math.ceil((date.getDate() - date.getDay()) / 7);
                const weekKey = `Week ${weekNum}`;
                
                if (!weeks[weekKey]) weeks[weekKey] = { present: 0, total: 0 };
                weeks[weekKey].total++;
                if (record.present) weeks[weekKey].present++;
            });
        });

        return Object.entries(weeks)
            .slice(-4) // Last 4 weeks
            .map(([week, stats]) => ({
                week,
                rate: stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(2) + '%' : '0%'
            }));
    }

    // Generate bulk predictions
    generateBulkPredictions(registeredStudents) {
        return registeredStudents
            .map(student => this.predictAttendance(student))
            .filter(p => p !== null);
    }

    // ===== AI INSIGHTS FORMATTER =====
    formatInsightsForDisplay(insights) {
        return {
            classAverage: insights.classStats.classAverage,
            todayStatus: `${insights.classStats.todayPresent} Present | ${insights.classStats.todayAbsent} Absent`,
            topStudent: insights.topPerformers.length > 0 ? insights.topPerformers[0].name : 'N/A',
            atRiskCount: insights.atRiskStudents.length,
            bestDay: insights.bestAttendanceDay.day,
            trend: insights.weeklyTrends.length > 0 ? insights.weeklyTrends.slice(-1)[0].rate : 'N/A'
        };
    }
}

// ===== AI CHATBOT FOR ATTENDANCE INSIGHTS =====
class AIAssistant {
    constructor(aiEngine) {
        this.engine = aiEngine;
        this.conversationHistory = [];
    }

    // Generate AI response based on user query
    generateResponse(query, registeredStudents) {
        const lowerQuery = query.toLowerCase();
        
        if (lowerQuery.includes('prediction') || lowerQuery.includes('predict')) {
            return this.getPredictionResponse(registeredStudents);
        } else if (lowerQuery.includes('risk') || lowerQuery.includes('at-risk')) {
            return this.getRiskResponse(registeredStudents);
        } else if (lowerQuery.includes('best') || lowerQuery.includes('top')) {
            return this.getTopPerformersResponse(registeredStudents);
        } else if (lowerQuery.includes('anomal') || lowerQuery.includes('unusual')) {
            return this.getAnomalyResponse(registeredStudents);
        } else if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest')) {
            return this.getRecommendationResponse(registeredStudents);
        } else if (lowerQuery.includes('trend') || lowerQuery.includes('pattern')) {
            return this.getTrendResponse(registeredStudents);
        } else if (lowerQuery.includes('help') || lowerQuery.includes('?')) {
            return this.getHelpResponse();
        } else {
            return this.getGeneralResponse(registeredStudents);
        }
    }

    getPredictionResponse(registeredStudents) {
        const insights = this.engine.getDetailedInsights(registeredStudents);
        const predictions = insights.predictions.slice(0, 3);
        
        let response = '🔮 **Attendance Predictions:**\n\n';
        predictions.forEach(p => {
            response += `👤 **${p.studentName}**\n`;
            response += `   • Historical Rate: ${p.historicalRate}%\n`;
            response += `   • Risk Level: ${p.riskLevel}\n`;
            response += `   • Trend: ${p.trendDirection}\n`;
            response += `   • Confidence: ${p.confidenceScore}\n\n`;
        });
        return response;
    }

    getRiskResponse(registeredStudents) {
        const insights = this.engine.getDetailedInsights(registeredStudents);
        const atRisk = insights.atRiskStudents;
        
        if (atRisk.length === 0) {
            return '✅ **Good News!** No students are currently at risk. All students have attendance rates above 75%.';
        }
        
        let response = '⚠️ **At-Risk Students Report:**\n\n';
        atRisk.forEach(student => {
            response += `${student.riskIndicator} **${student.name}** - ${student.rate}% attendance\n`;
        });
        response += '\n💡 Recommend immediate intervention for flagged students.';
        return response;
    }

    getTopPerformersResponse(registeredStudents) {
        const insights = this.engine.getDetailedInsights(registeredStudents);
        const top = insights.topPerformers;
        
        if (top.length === 0) {
            return 'No attendance data available yet.';
        }
        
        let response = '🏆 **Top Performers:**\n\n';
        top.forEach(student => {
            response += `${student.badge} **#${student.rank} - ${student.name}** - ${student.rate}%\n`;
        });
        return response;
    }

    getAnomalyResponse(registeredStudents) {
        const anomalies = this.engine.detectAnomalies(registeredStudents);
        
        if (anomalies.length === 0) {
            return '✅ **Normal Operations** - No unusual attendance patterns detected.';
        }
        
        let response = '🚨 **Anomalies Detected:**\n\n';
        anomalies.forEach(anomaly => {
            response += `${anomaly.type}\n`;
            response += `   Student: ${anomaly.studentName}\n`;
            response += `   Severity: ${anomaly.severity}\n`;
            response += `   Action: ${anomaly.action}\n\n`;
        });
        return response;
    }

    getRecommendationResponse(registeredStudents) {
        const recommendations = this.engine.generateRecommendations(registeredStudents);
        const recs = Object.values(recommendations).slice(0, 3);
        
        let response = '💡 **AI Recommendations:**\n\n';
        recs.forEach(rec => {
            response += `📋 **${rec.studentName}**\n`;
            if (rec.recommendations.length > 0) {
                const topRec = rec.recommendations[0];
                response += `   ${topRec.priority} | ${topRec.action}\n`;
                response += `   Impact: ${topRec.impact}\n\n`;
            }
        });
        return response;
    }

    getTrendResponse(registeredStudents) {
        const insights = this.engine.getDetailedInsights(registeredStudents);
        const trends = insights.weeklyTrends;
        
        let response = '📊 **Weekly Trends:**\n\n';
        trends.forEach(trend => {
            response += `${trend.week}: ${trend.rate}\n`;
        });
        response += `\n📈 Best Day: ${insights.bestAttendanceDay.day} (${insights.bestAttendanceDay.rate})`;
        return response;
    }

    getGeneralResponse(registeredStudents) {
        const insights = this.engine.getDetailedInsights(registeredStudents);
        const stats = insights.classStats;
        
        let response = '📊 **Attendance Overview:**\n\n';
        response += `📚 Total Students: ${stats.totalStudents}\n`;
        response += `✅ Today Present: ${stats.todayPresent}\n`;
        response += `❌ Today Absent: ${stats.todayAbsent}\n`;
        response += `📈 Class Average: ${stats.classAverage}\n\n`;
        response += `💬 Try asking about predictions, risks, top performers, or recommendations!`;
        return response;
    }

    getHelpResponse() {
        return `🤖 **AI Assistant Help:**\n\n
        Ask me about:
        - **Predictions** - Future attendance forecasts
        - **At-Risk Students** - Who needs intervention
        - **Top Performers** - Excellence recognition
        - **Anomalies** - Unusual patterns
        - **Recommendations** - Action items
        - **Trends** - Weekly/monthly patterns
        - **Statistics** - Class-wide metrics`;
    }
}

// Initialize AI Engine
const aiEngine = new AIAttendanceEngine();
const aiAssistant = new AIAssistant(aiEngine);
