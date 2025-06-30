import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, AlertTriangle, FileText, Save, RefreshCw } from 'lucide-react';
import instance from '../../utils/axiosInstance';

function WeekLogUpdate() {
  const [weeks, setWeeks] = useState(Array(12).fill('07-07-2025'));
  const [initialWeeks, setInitialWeeks] = useState(Array(12).fill('07-07-2025'));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [semester, setSemester] = useState('5');
  const [initialSemester, setInitialSemester] = useState('5');

  // Format date from database to YYYY-MM-DD format for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch deadlines when semester changes
  useEffect(() => {
    const fetchSemesterDeadlines = async () => {
      try {
        setLoading(true);
        const res = await instance.get(`/admin/get_semester_deadlines/${semester}`);
        console.log(res.data);
        if (res.data.success) {
          if (res.data.data) {
            // Format dates for input fields
            const formattedWeeks = res.data.data.weeks.map(dateString =>
              formatDateForInput(dateString)
            );
            setWeeks(formattedWeeks);
            // Store the original dates for comparison
            setInitialWeeks(res.data.data.weeks);
          } else {
            // If no deadlines exist for this semester, reset to empty
            setWeeks(Array(12).fill(''));
            setInitialWeeks(Array(12).fill(''));
          }
        } else {
          setError('Failed to load deadlines for this semester');
        }
      } catch (err) {
        console.error('Error fetching semester deadlines:', err);
        setError('Failed to load deadlines for this semester');
      } finally {
        setLoading(false);
      }
    };

    fetchSemesterDeadlines();
  }, [semester]);

  // Handle semester change
  const handleSemesterChange = (e) => {
    setSemester(e.target.value);
    setError(null);
    setMessage(null);
  };

  // Initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsInitialLoad(true);
        // First fetch the semester deadlines for default semester (5)
        const semesterRes = await instance.get(`/admin/get_semester_deadlines/${semester}`);
        console.log(semesterRes.data);
        if (semesterRes.data.success && semesterRes.data.data) {
          const formattedWeeks = semesterRes.data.data.weeks.map(dateString =>
            formatDateForInput(dateString)
          );
          setWeeks(formattedWeeks);
          setInitialWeeks(semesterRes.data.data.weeks);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleChange = (index, value) => {
    const newWeeks = [...weeks];
    newWeeks[index] = value;
    setWeeks(newWeeks);
  };

  const isValidFutureDate = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return !isNaN(date) && date >= new Date(today.toDateString());
  };

  const hasChanges = () => {
    return weeks.some((week, index) => week !== initialWeeks[index]) || semester !== initialSemester;
  };

  const allDatesValid = () => {
    return weeks.every(week => !week || isValidFutureDate(week));
  };

  const handleSubmit = async () => {
    const allValid = allDatesValid();
    if (!allValid) {
      setError('Please enter only valid future dates for all weeks.');
      setMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const data = weeks.reduce((acc, curr, index) => {
        acc[`week${index + 1}`] = curr;
        return acc;
      }, {});

      // Include semester in the payload
      const payload = {
        data,
        semester: semester
      };
      console.log(payload);
      const res = await instance.post(
        `/admin/insert_deadlines_for_all_teams`,
        payload
      );
      console.log(res);
      setInitialWeeks([...weeks]);
      setInitialSemester(semester);
      setMessage('Weekly deadlines have been successfully updated in the system.');
    } catch (err) {
      setError('An error occurred while updating the deadline information. Please try again.', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setWeeks([...initialWeeks]);
    setSemester(initialSemester);
    setError(null);
    setMessage(null);
  };

  const filledWeeks = weeks.filter(week => week !== '').length;
  const isUpdateMode = initialWeeks.some(week => week !== '');
  const showSubmitButton = hasChanges() || !isUpdateMode;

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-brpy-10 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="rounded-2xl p-6">
          <div className="flex justify-center gap-4">
            <div>
              <h1 className="text-3xl flex justify-center font-bold text-gray-900">Weekly Deadline Management</h1>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="mb-4 flex bg-white items-center gap-3">
            <FileText className="w-5 h-5 bg-white text-gray-600" />
            <h2 className="text-xl font-semibold bg-white text-gray-900">Set Weekly Deadlines</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6 bg-white">
            {isUpdateMode ? 'Update existing weekly deadlines' : 'Set new weekly deadlines'}
          </p>

          {/* Semester Selector */}
          <div className="mb-6 bg-white">
            <label className="block bg-white text-sm font-medium text-gray-700 mb-1">
              Semester
            </label>
            <select
              value={semester}
              onChange={handleSemesterChange}
              disabled={loading}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
          </div>

          {/* Week Inputs */}
          <div className="grid bg-white grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {weeks.map((week, index) => {
              const isValid = !week || isValidFutureDate(week);
              return (
                <div key={index} className='bg-white'>
                  <label className="block bg-white text-sm font-medium text-gray-700 mb-1">
                    Week {String(index + 1).padStart(2, '0')}
                  </label>
                  <input
                    type="date"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none transition-all ${week && !isValid
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : week && isValid
                        ? 'border-green-300 focus:ring-green-500 bg-green-50'
                        : 'border-gray-300 focus:ring-blue-500 bg-white'
                      }`}
                    value={week}
                    onChange={(e) => handleChange(index, e.target.value)}
                  />
                  {week && (
                    <div className="text-xs mt-1 bg-white flex items-center gap-1">
                      {isValid ? (
                        <span className="text-green-600 bg-white flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 bg-white" /> Valid
                        </span>
                      ) : (
                        <span className="text-red-600 bg-white flex items-center gap-1">
                          <AlertTriangle className="w-4 bg-white h-4" /> Invalid
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Alerts */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-300 rounded-lg">
              <p className="text-red-700 bg-red-50 text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 bg-red-50 h-4" /> {error}
              </p>
            </div>
          )}
          {message && (
            <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-lg">
              <p className="text-green-700 text-sm bg-green-50 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 bg-green-50 h-4" /> {message}
              </p>
            </div>
          )}

          {/* Sticky Action Bar */}
          <div className="sticky bottom-0 mt-10 bg-white border-t pt-4 pb-2 flex justify-between items-center">
            <div className="text-xs bg-white text-gray-500">
              ⚠️ All deadlines apply to every team automatically after saving.
            </div>
            <div className="flex bg-white gap-2">
              {hasChanges() && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Reset
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading || (!hasChanges() && isUpdateMode) || !allDatesValid()}
                className="px-5 py-2 text-sm font-medium bg-blue-600 group text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing
                  </>
                ) : (
                  <>
                    <Save className="w-4 bg-blue-600 700 transition disabled:opacity-50 group-hover:bg-blue-700 h-4" />
                    {isUpdateMode ? 'Update Deadlines' : 'Set Deadlines'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeekLogUpdate;