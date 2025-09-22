import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import userPreferencesService, { UserPreferences } from '../services/userPreferencesService';

export default function UserPreferencesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  // Form state
  const [preferredGender, setPreferredGender] = useState<'all' | 'male' | 'female'>('all');
  const [preferredLanguage, setPreferredLanguage] = useState('english');
  const [ageRangeStart, setAgeRangeStart] = useState(25);
  const [ageRangeEnd, setAgeRangeEnd] = useState(65);

 const languages = [
    { value: 'english', label: 'English' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'tamil', label: 'Tamil' },
    { value: 'polish', label: 'Polish' },
    { value: 'romanian', label: 'Romanian' },
    { value: 'spanish', label: 'Spanish' },
    { value: 'italian', label: 'Italian' },
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await userPreferencesService.getPreferences();
      setPreferences(data);
      
      // Set form values
      setPreferredGender(data.service_user_preferences.preferred_therapist_gender);
      setPreferredLanguage(data.service_user_preferences.preferred_language);
      setAgeRangeStart(data.service_user_preferences.age_range_therapist.start);
      setAgeRangeEnd(data.service_user_preferences.age_range_therapist.end);
    } catch (error) {
      Alert.alert('Error', 'Failed to load preferences');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      
      const updatedPreferences = {
        preferred_therapist_gender: preferredGender,
        preferred_language: preferredLanguage,
        preferred_age_range_therapist_start: ageRangeStart,
        preferred_age_range_therapist_end: ageRangeEnd,
      };

      await userPreferencesService.updatePreferences(updatedPreferences);
      Alert.alert('Success', 'Preferences saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const resetPreferences = async () => {
    Alert.alert(
      'Reset Preferences',
      'Are you sure you want to reset all preferences to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const data = await userPreferencesService.resetPreferences();
              setPreferences(data);
              
              // Update form values
              setPreferredGender(data.service_user_preferences.preferred_therapist_gender);
              setPreferredLanguage(data.service_user_preferences.preferred_language);
              setAgeRangeStart(data.service_user_preferences.age_range_therapist.start);
              setAgeRangeEnd(data.service_user_preferences.age_range_therapist.end);
              
              Alert.alert('Success', 'Preferences reset successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset preferences');
              console.error(error);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9A563A" />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.resetContainer}>
        <TouchableOpacity onPress={resetPreferences} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>

        {/* Preferred Therapist Gender */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Therapist Gender</Text>
          <View style={styles.genderContainer}>
            {['any', 'male', 'female'].map((gender) => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.genderOption,
                  preferredGender === gender && styles.genderOptionSelected
                ]}
                onPress={() => setPreferredGender(gender as any)}
              >
                <Text style={[
                  styles.genderOptionText,
                  preferredGender === gender && styles.genderOptionTextSelected
                ]}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preferred Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Language</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={preferredLanguage}
              onValueChange={(value) => setPreferredLanguage(value)}
              style={styles.picker}
            >
              {languages.map((lang) => (
                <Picker.Item
                  key={lang.value}
                  label={lang.label}
                  value={lang.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Age Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Therapist Age Range</Text>
          <Text style={styles.ageRangeText}>
            {ageRangeStart} - {ageRangeEnd} years
          </Text>
          
          <Text style={styles.sliderLabel}>Minimum Age: {ageRangeStart}</Text>
          <Slider
            style={styles.slider}
            minimumValue={18}
            maximumValue={75}
            value={ageRangeStart}
            onValueChange={setAgeRangeStart}
            step={1}
            minimumTrackTintColor="#9A563A"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#9A563A"
          />

          <Text style={styles.sliderLabel}>Maximum Age: {ageRangeEnd}</Text>
          <Slider
            style={styles.slider}
            minimumValue={ageRangeStart + 1}
            maximumValue={80}
            value={ageRangeEnd}
            onValueChange={setAgeRangeEnd}
            step={1}
            minimumTrackTintColor="#9A563A"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#9A563A"
          />
        </View>

        {/* Last Updated */}
        {preferences?.last_updated && (
          <View style={styles.section}>
            <Text style={styles.lastUpdatedText}>
              Last updated: {new Date(preferences.last_updated).toLocaleDateString()}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={savePreferences}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  resetButton: {
    padding: 5,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 12,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  genderOptionSelected: {
    backgroundColor: '#9A563A',
    borderColor: '#9A563A',
  },
  genderOptionText: {
    fontSize: 14,
    color: '#687076',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  ageRangeText: {
    fontSize: 16,
    color: '#9A563A',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#687076',
    marginBottom: 8,
    marginTop: 12,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#9A563A',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#687076',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#9A563A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#9A563A',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#B0B0B0',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resetContainer: {
  alignItems: 'flex-end',
  paddingHorizontal: 20,
  paddingTop: 15,
  paddingBottom: 10,
},
});