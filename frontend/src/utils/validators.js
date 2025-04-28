export const validateRegisterForm = (formData) => {
  const errors = {};
  const { username, email, password, confirmPassword } = formData;

  if (!username.trim()) {
    errors.username = 'Username is required';
  } else if (username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  }

  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email is invalid';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};