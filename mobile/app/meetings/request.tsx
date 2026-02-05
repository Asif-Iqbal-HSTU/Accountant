import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, StatusBar } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, DateData } from 'react-native-calendars';
import api from '../../services/api';

const TIME_SLOTS = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'
];

const MEETING_TYPES = [
    { id: 'video', label: 'Video Call', icon: 'videocam' },
    { id: 'phone', label: 'Phone Call', icon: 'call' },
    { id: 'in_person', label: 'In Person', icon: 'people' },
    { id: 'quick_check_in', label: 'Quick Check-in', icon: 'flash' },
];

const URGENCY_LEVELS = [
    { id: 'low', label: 'Low' },
    { id: 'medium', label: 'Medium' },
    { id: 'high', label: 'High' },
    { id: 'urgent', label: 'Urgent' },
];

export default function RequestMeetingScreen() {
    const { id } = useLocalSearchParams();
    const isEditMode = !!id;

    // State
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [meetingType, setMeetingType] = useState('video');
    const [urgency, setUrgency] = useState('medium');
    const [agenda, setAgenda] = useState('');
    const [accountant, setAccountant] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [originalMeeting, setOriginalMeeting] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const accResponse = await api.get('/accountants');
            if (accResponse.data.length > 0) {
                setAccountant(accResponse.data[0]);
            } else {
                Alert.alert('Error', 'No accountant found linked to your account.');
                router.back();
                return;
            }

            if (isEditMode) {
                const meetingResponse = await api.get(`/meetings/${id}`);
                const meeting = meetingResponse.data;
                setOriginalMeeting(meeting);

                setMeetingType(meeting.type);
                setUrgency(meeting.urgency);
                setAgenda(meeting.agenda || '');
                // Note: We don't pre-fill proposed slots because typically you'd want to pick new ones if rescheduling
                // But we could toggle the old ones if we parsed them. 
                // Let's assume user starts fresh for simplicity on slots.
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load details');
        } finally {
            setLoading(false);
        }
    };

    const toggleSlot = (time: string) => {
        if (selectedSlots.includes(time)) {
            setSelectedSlots(selectedSlots.filter(s => s !== time));
        } else {
            if (selectedSlots.length >= 3) {
                Alert.alert('Limit Reached', 'You can propose up to 3 slots.');
                return;
            }
            setSelectedSlots([...selectedSlots, time]);
        }
    };

    const handleSubmit = async () => {
        if (!selectedDate) {
            Alert.alert('Missing Information', 'Please select a date.');
            return;
        }
        if (selectedSlots.length === 0) {
            Alert.alert('Missing Information', 'Please select at least one time slot.');
            return;
        }
        if (!accountant) return;

        setSubmitting(true);

        const proposedSlots = selectedSlots.map(time => {
            return `${selectedDate}T${time}:00`;
        });

        try {
            if (isEditMode) {
                // Reschedule / Counter-Propose
                await api.put(`/meetings/${id}`, {
                    status: 'pending_accountant', // Send back to accountant
                    proposed_slots: proposedSlots,
                    latest_negotiation_note: agenda // Use agenda as note for reschedule context
                });
                Alert.alert('Success', 'Reschedule request sent!', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)/meetings') }
                ]);
            } else {
                // New Request
                await api.post('/meetings', {
                    accountant_id: accountant.id,
                    title: `${MEETING_TYPES.find(t => t.id === meetingType)?.label} with ${accountant.name}`,
                    agenda,
                    type: meetingType,
                    urgency,
                    proposed_slots: proposedSlots,
                });
                Alert.alert('Success', 'Meeting request sent successfully!', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)/meetings') }
                ]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to submit meeting request');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#14b8a6" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: isEditMode ? 'Reschedule Meeting' : 'Request Meeting',
                    headerStyle: { backgroundColor: '#0f172a' },
                    headerTintColor: '#fff',
                    headerBackTitle: 'Back',
                }}
            />
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* 1. Select Date */}
                <Text style={styles.sectionTitle}>1. Select Preferred Date</Text>
                <View style={styles.calendarContainer}>
                    <Calendar
                        onDayPress={(day: DateData) => {
                            setSelectedDate(day.dateString);
                            setSelectedSlots([]);
                        }}
                        markedDates={{
                            [selectedDate]: { selected: true, selectedColor: '#14b8a6' }
                        }}
                        theme={{
                            backgroundColor: 'transparent',
                            calendarBackground: 'transparent',
                            textSectionTitleColor: '#94a3b8',
                            selectedDayBackgroundColor: '#14b8a6',
                            selectedDayTextColor: '#ffffff',
                            todayTextColor: '#14b8a6',
                            dayTextColor: '#e2e8f0',
                            textDisabledColor: '#475569',
                            monthTextColor: '#f8fafc',
                            arrowColor: '#14b8a6',
                        }}
                        minDate={new Date().toISOString().split('T')[0]}
                    />
                </View>

                {/* 2. Select Time Slots */}
                {selectedDate ? (
                    <>
                        <Text style={styles.sectionTitle}>2. Suggest 2-3 Time Slots</Text>
                        <View style={styles.slotsGrid}>
                            {TIME_SLOTS.map(time => (
                                <TouchableOpacity
                                    key={time}
                                    style={[
                                        styles.slotChip,
                                        selectedSlots.includes(time) && styles.slotChipSelected
                                    ]}
                                    onPress={() => toggleSlot(time)}
                                >
                                    <Text style={[
                                        styles.slotText,
                                        selectedSlots.includes(time) && styles.slotTextSelected
                                    ]}>{time}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.hintText}>
                            Selected: {selectedSlots.length}/3
                        </Text>
                    </>
                ) : null}

                {/* 3. Meeting Info */}
                <Text style={styles.sectionTitle}>3. Meeting Details</Text>

                {/* Only editable for new requests, locked for rescheduling to avoid context switch annoyance, or maybe let them? Let's just keep editable. */}
                <Text style={styles.label}>Meeting Type</Text>
                <View style={styles.typeGrid}>
                    {MEETING_TYPES.map(type => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.typeCard,
                                meetingType === type.id && styles.typeCardSelected
                            ]}
                            onPress={() => setMeetingType(type.id)}
                        >
                            <Ionicons
                                name={type.icon as any}
                                size={24}
                                color={meetingType === type.id ? '#14b8a6' : '#94a3b8'}
                            />
                            <Text style={[
                                styles.typeLabel,
                                meetingType === type.id && styles.typeLabelSelected
                            ]}>{type.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Urgency</Text>
                <View style={styles.urgencyRow}>
                    {URGENCY_LEVELS.map(level => (
                        <TouchableOpacity
                            key={level.id}
                            style={[
                                styles.urgencyChip,
                                urgency === level.id && styles.urgencyChipSelected
                            ]}
                            onPress={() => setUrgency(level.id)}
                        >
                            <Text style={[
                                styles.urgencyText,
                                urgency === level.id && styles.urgencyTextSelected
                            ]}>{level.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>
                    {isEditMode ? 'Reschedule Note / Reason' : 'Agenda / Notes'}
                </Text>
                <TextInput
                    style={styles.input}
                    placeholder={isEditMode ? "Why do you need to reschedule? Propose a new plan..." : "What would you like to discuss?"}
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={4}
                    value={agenda}
                    onChangeText={setAgenda}
                />

                <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitBtnText}>
                            {isEditMode ? 'Send Reschedule Request' : 'Send Request'}
                        </Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
    content: { padding: 20 },
    sectionTitle: {
        fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 24, marginBottom: 16,
    },
    calendarContainer: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    slotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    slotChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    slotChipSelected: {
        backgroundColor: 'rgba(20, 184, 166, 0.2)',
        borderColor: '#14b8a6',
    },
    slotText: { color: '#94a3b8', fontSize: 14 },
    slotTextSelected: { color: '#14b8a6', fontWeight: 'bold' },
    hintText: { color: '#64748b', marginTop: 8, fontSize: 12 },
    label: { color: '#94a3b8', fontSize: 14, marginTop: 20, marginBottom: 8, fontWeight: '600' },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    typeCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    typeCardSelected: {
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        borderColor: '#14b8a6',
    },
    typeLabel: { color: '#94a3b8', marginTop: 8, fontSize: 13, fontWeight: '500' },
    typeLabelSelected: { color: '#14b8a6', fontWeight: 'bold' },
    urgencyRow: {
        flexDirection: 'row',
        gap: 8,
    },
    urgencyChip: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    urgencyChipSelected: {
        backgroundColor: 'rgba(20, 184, 166, 0.2)',
        borderColor: '#14b8a6',
    },
    urgencyText: { color: '#94a3b8', fontSize: 12 },
    urgencyTextSelected: { color: '#14b8a6', fontWeight: 'bold' },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        color: '#fff',
        padding: 16,
        fontSize: 16,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    submitBtn: {
        backgroundColor: '#14b8a6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 32,
    },
    submitBtnDisabled: {
        opacity: 0.7,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
