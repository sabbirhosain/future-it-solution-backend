// Helper function to convert string to Sentence Case
export const toSentenceCase = (value) => {
    if (!value) return '';
    return value.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
};

// Format date and time ( 2025-04-13T12:50 to 13-04-2025 12:50PM )
export const formatDateTime = (input) => {
    if (!input) return '';

    const date = new Date(input);
    if (isNaN(date.getTime())) return '';

    // Convert to UTC+6 manually
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const offsetDate = new Date(utc + 6 * 60 * 60 * 1000); // UTC +6

    const day = String(offsetDate.getDate()).padStart(2, '0');
    const month = String(offsetDate.getMonth() + 1).padStart(2, '0');
    const year = offsetDate.getFullYear();

    let hours = offsetDate.getHours();
    const minutes = String(offsetDate.getMinutes()).padStart(2, '0');

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format

    const formattedTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    return `${day}-${month}-${year} ${formattedTime}`;
};

// Format date ( 2025-04-13 to 13-04-2025 )
export const formatDateOnly = (input) => {
    const date = new Date(input);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
}