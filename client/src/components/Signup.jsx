// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { signup, checkUsername, clearError } from '../redux/slices/authSlice';
// import { useNavigate } from 'react-router-dom';
// import './Signup.css';

// const avatars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,11,12,13,14,15,16,17,18,19];

// const Signup = () => {
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     name: '',
//     avatar: 1
//   });
  
//   const [usernameAvailable, setUsernameAvailable] = useState(null);
//   const [checkingUsername, setCheckingUsername] = useState(false);
//   const [errors, setErrors] = useState({});
  
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

//   useEffect(() => {
//     if (isAuthenticated) {
//       navigate('/dashboard');
//     }
//   }, [isAuthenticated, navigate]);

//   useEffect(() => {
//     return () => {
//       dispatch(clearError());
//     };
//   }, [dispatch]);

//   // Real-time username availability check
//   useEffect(() => {
//     const checkUsernameAvailability = async () => {
//       if (formData.username.length >= 3) {
//         setCheckingUsername(true);
//         const result = await dispatch(checkUsername(formData.username)).unwrap();
//         setUsernameAvailable(result.available);
//         setCheckingUsername(false);
//       } else {
//         setUsernameAvailable(null);
//       }
//     };

//     const timeoutId = setTimeout(checkUsernameAvailability, 500);
//     return () => clearTimeout(timeoutId);
//   }, [formData.username, dispatch]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
    
//     // Clear error for this field
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const handleAvatarSelect = (avatarNum) => {
//     setFormData(prev => ({ ...prev, avatar: avatarNum }));
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.name.trim()) {
//       newErrors.name = 'Name is required';
//     }

//     if (!formData.username.trim()) {
//       newErrors.username = 'Username is required';
//     } else if (formData.username.length < 3) {
//       newErrors.username = 'Username must be at least 3 characters';
//     } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
//       newErrors.username = 'Username can only contain letters, numbers, and underscores';
//     } else if (!usernameAvailable) {
//       newErrors.username = 'Username is already taken';
//     }

//     if (!formData.email.trim()) {
//       newErrors.email = 'Email is required';
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = 'Email is invalid';
//     }

//     if (!formData.password) {
//       newErrors.password = 'Password is required';
//     } else if (formData.password.length < 6) {
//       newErrors.password = 'Password must be at least 6 characters';
//     }

//     if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = 'Passwords do not match';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     if (validateForm()) {
//       const { confirmPassword, ...signupData } = formData;
//       dispatch(signup(signupData));
//     }
//   };

//   return (
//   <div className="signup-page">
//     <div className="signup-overlay" />

//     <div className="signup-wrapper">
//       <div className="signup-card">
//         <div className="signup-header">
//           <h1>Create Account</h1>
//           <p>Join the learning community</p>
//         </div>

//         <form onSubmit={handleSubmit} className="signup-form two-column">
//   {/* LEFT SIDE – FORM */}
//   <div className="form-left">
//     {error && <div className="error-message">{error}</div>}

//     {/* Name */}
//     <div className="form-group">
//       <label htmlFor="name">Full Name *</label>
//       <input
//         type="text"
//         id="name"
//         name="name"
//         value={formData.name}
//         onChange={handleChange}
//         placeholder="John Doe"
//         className={errors.name ? 'error' : ''}
//       />
//       {errors.name && <span className="error-text">{errors.name}</span>}
//     </div>

//     {/* Username */}
//     <div className="form-group">
//       <label htmlFor="username">Username * (unique)</label>
//       <div className="input-with-status">
//         <input
//           type="text"
//           id="username"
//           name="username"
//           value={formData.username}
//           onChange={handleChange}
//           placeholder="johndoe"
//           className={errors.username ? 'error' : ''}
//         />
//         {checkingUsername && (
//           <span className="username-status checking">Checking...</span>
//         )}
//         {usernameAvailable === true && (
//           <span className="username-status available">✓ Available</span>
//         )}
//         {usernameAvailable === false && (
//           <span className="username-status taken">✗ Taken</span>
//         )}
//       </div>
//       {errors.username && <span className="error-text">{errors.username}</span>}
//       <small className="help-text">This will be your unique identifier</small>
//     </div>

//     {/* Email */}
//     <div className="form-group">
//       <label htmlFor="email">Email *</label>
//       <input
//         type="email"
//         id="email"
//         name="email"
//         value={formData.email}
//         onChange={handleChange}
//         placeholder="john@example.com"
//         className={errors.email ? 'error' : ''}
//       />
//       {errors.email && <span className="error-text">{errors.email}</span>}
//     </div>

//     {/* Password */}
//     <div className="form-group">
//       <label htmlFor="password">Password *</label>
//       <input
//         type="password"
//         id="password"
//         name="password"
//         value={formData.password}
//         onChange={handleChange}
//         placeholder="At least 6 characters"
//         className={errors.password ? 'error' : ''}
//       />
//       {errors.password && <span className="error-text">{errors.password}</span>}
//     </div>

//     {/* Confirm Password */}
//     <div className="form-group">
//       <label htmlFor="confirmPassword">Confirm Password *</label>
//       <input
//         type="password"
//         id="confirmPassword"
//         name="confirmPassword"
//         value={formData.confirmPassword}
//         onChange={handleChange}
//         placeholder="Re-enter password"
//         className={errors.confirmPassword ? 'error' : ''}
//       />
//       {errors.confirmPassword && (
//         <span className="error-text">{errors.confirmPassword}</span>
//       )}
//     </div>

//     <button
//       type="submit"
//       className="signup-btn"
//       disabled={isLoading || checkingUsername}
//     >
//       {isLoading ? 'Creating Account...' : 'Sign Up'}
//     </button>
//   </div>

//   {/* RIGHT SIDE – AVATARS */}
//   <div className="form-right">
//     <label className="avatar-title">Choose Avatar</label>
//     <div className="avatar-grid">
//       {avatars.map(num => (
//         <div
//           key={num}
//           className={`avatar-option ${
//             formData.avatar === num ? 'selected' : ''
//           }`}
//           onClick={() => handleAvatarSelect(num)}
//         >
//           <img
//             src={`/avatars/avatar-${num}.png`}
//             alt={`Avatar ${num}`}
//             onError={(e) => {
//               e.target.src = `https://ui-avatars.com/api/?name=${num}&background=667eea&color=fff&size=80`;
//             }}
//           />
//         </div>
//       ))}
//     </div>
//   </div>
// </form>


//         <div className="signup-footer">
//           <p>
//             Already have an account? <a href="/login">Login</a>
//           </p>
//         </div>
//       </div>
//     </div>
//   </div>
// );

// };

// export default Signup;



// import React, { useState , useEffect} from 'react';
// import { useDispatch } from 'react-redux';
// import { useNavigate, Link } from 'react-router-dom';
// import { signup } from '../redux/slices/authSlice';
// import './Signup.css';

// const Signup = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
  
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     name: '',
//     avatar: 1,
//     securityQuestion: 'What is your favorite book?',
//     securityAnswer: ''
//   });

//   const [isLoading, setIsLoading] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [checkingUsername, setCheckingUsername] = useState(false);
//  const [usernameAvailable, setUsernameAvailable] = useState(null);

//   const securityQuestions = [
//     'What is your favorite book?',
//     'What city were you born in?',
//     'What is your mother\'s maiden name?',
//     'What was the name of your first pet?',
//     'What is your favorite movie?',
//     'What was your childhood nickname?',
//     'What is your favorite food?',
//     'What street did you grow up on?'
//   ];

//   const avatars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,11,12,13,14,15,16,17,18,19];

//   const getAvatarUrl = (avatarNum) => {
//     return `/avatars/avatar-${avatarNum}.png`;
//   };

  

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//       if (errors[e]) {
//     setErrors(prev => ({ ...prev, [e.target.name]: '' }));
//     }
    
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.name.trim()) {
//       newErrors.name = 'Name is required';
//     }

//     if (!formData.username.trim()) {
//       newErrors.username = 'Username is required';
//     } else if (formData.username.length < 3) {
//       newErrors.username = 'Username must be at least 3 characters';
//     } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
//       newErrors.username = 'Username can only contain letters, numbers, and underscores';
//     } else if (!usernameAvailable) {
//       newErrors.username = 'Username is already taken';
//     }

//     if (!formData.email.trim()) {
//       newErrors.email = 'Email is required';
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = 'Email is invalid';
//     }

//     if (!formData.password) {
//       newErrors.password = 'Password is required';
//     } else if (formData.password.length < 6) {
//       newErrors.password = 'Password must be at least 6 characters';
//     }

//     if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = 'Passwords do not match';
//     }
//     if (!formData.securityAnswer.trim()) {
//       alert('Please provide an answer to the security question');
//       return;
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     if (validateForm()) {
//       const { confirmPassword, ...signupData } = formData;
//       dispatch(signup(signupData));
//     }
//   };

//   // const handleSubmit = async (e) => {
//   //   e.preventDefault();

//   //   if (formData.password !== formData.confirmPassword) {
//   //     alert('Passwords do not match!');
//   //     return;
//   //   }

//   //   if (formData.password.length < 6) {
//   //     alert('Password must be at least 6 characters long');
//   //     return;
//   //   }

//   //   if (!formData.securityAnswer.trim()) {
//   //     alert('Please provide an answer to the security question');
//   //     return;
//   //   }

//   //   setIsLoading(true);

//   //   try {
//   //     const signupData = {
//   //       username: formData.username,
//   //       email: formData.email,
//   //       password: formData.password,
//   //       name: formData.name,
//   //       avatar: formData.avatar,
//   //       securityQuestion: formData.securityQuestion,
//   //       securityAnswer: formData.securityAnswer
//   //     };

//   //     await dispatch(signup(signupData)).unwrap();
//   //     navigate('/dashboard');
//   //   } catch (error) {
//   //     alert(error || 'Signup failed');
//   //   } finally {
//   //     setIsLoading(false);
//   //   }
//   // };

//   //   // Real-time username availability check
//   useEffect(() => {
//     const checkUsernameAvailability = async () => {
//       if (formData.username.length >= 3) {
//         setCheckingUsername(true);
//         const result = await dispatch(checkUsername(formData.username)).unwrap();
//         setUsernameAvailable(result.available);
//         setCheckingUsername(false);
//       } else {
//         setUsernameAvailable(null);
//       }
//     };

//     const timeoutId = setTimeout(checkUsernameAvailability, 500);
//     return () => clearTimeout(timeoutId);
//   }, [formData.username, dispatch]);



//   return (
//     <div className="auth-container">
//       <div className="auth-card">
//         <h2>Create Account</h2>
//         <p className="auth-subtitle">Join us to start your learning journey</p>

//         <form onSubmit={handleSubmit} className="auth-form">
//           <div className="form-group-auth">
//             <label htmlFor="name">Full Name *</label>
//             <input
//               type="text"
//               id="name"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               placeholder="Enter your full name"
//               required
//             />
//           </div>

//           {/* <div className="form-group-auth">
//             <label htmlFor="username">Username *</label>
//             <input
//               type="text"
//               id="username"
//               name="username"
//               value={formData.username}
//               onChange={handleChange}
//               placeholder="Choose a username"
//               required
//             />
//           </div> */}
          
//           <div className="form-group-auth">
//        <label htmlFor="username">Username * (unique)</label>
//        <div className="input-with-status">
//          <input
//            type="text"
//            id="username"
//            name="username"
//            value={formData.username}
//            onChange={handleChange}
//            placeholder="johndoe"
//            className={errors.username ? 'error' : ''}
//          />
//          {checkingUsername && (
//            <span className="username-status checking">Checking...</span>
//          )}
//          {usernameAvailable === true && (
//            <span className="username-status available">✓ Available</span>
//          )}
//          {usernameAvailable === false && (
//            <span className="username-status taken">✗ Taken</span>
//          )}
//        </div>
//        {errors.username && <span className="error-text">{errors.username}</span>}
//        <small className="help-text">This will be your unique identifier</small>
//      </div>

//           <div className="form-group-auth">
//             <label htmlFor="email">Email *</label>
//             <input
//               type="email"
//               id="email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               placeholder="Enter your email"
//               required
//             />
//           </div>

//           <div className="form-group-auth">
//             <label htmlFor="password">Password *</label>
//             <input
//               type="password"
//               id="password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               placeholder="Create a password (min 6 characters)"
//               required
//               minLength="6"
//             />
//           </div>

//           <div className="form-group-auth">
//             <label htmlFor="confirmPassword">Confirm Password *</label>
//             <input
//               type="password"
//               id="confirmPassword"
//               name="confirmPassword"
//               value={formData.confirmPassword}
//               onChange={handleChange}
//               placeholder="Confirm your password"
//               required
//               minLength="6"
//             />
//           </div>

//           <div className="form-group-auth">
//             <label>Choose Avatar *</label>
//             <div className="avatar-selector">
//               {avatars.map((avatarNum) => (
//                 <div
//                   key={avatarNum}
//                   className={`avatar-choice ${formData.avatar === avatarNum ? 'selected' : ''}`}
//                   onClick={() => setFormData({ ...formData, avatar: avatarNum })}
//                 >
//                   <img
//                     src={getAvatarUrl(avatarNum)}
//                     alt={`Avatar ${avatarNum}`}
//                     onError={(e) => {
//                       e.target.src = `https://ui-avatars.com/api/?name=Avatar${avatarNum}&background=4f46e5&color=fff&size=60`;
//                     }}
//                   />
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="security-section">
//             <h3>Security Question</h3>
//             <p className="security-note">This will help you reset your password if you forget it</p>
            
//             <div className="form-group-auth">
//               <label htmlFor="securityQuestion">Select a Question *</label>
//               <select
//                 id="securityQuestion"
//                 name="securityQuestion"
//                 value={formData.securityQuestion}
//                 onChange={handleChange}
//                 required
//               >
//                 {securityQuestions.map((question, index) => (
//                   <option key={index} value={question}>
//                     {question}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="form-group-auth">
//               <label htmlFor="securityAnswer">Your Answer *</label>
//               <input
//                 type="text"
//                 id="securityAnswer"
//                 name="securityAnswer"
//                 value={formData.securityAnswer}
//                 onChange={handleChange}
//                 placeholder="Enter your answer"
//                 required
//               />
//               <small className="hint-text">Remember this answer - you'll need it to reset your password</small>
//             </div>
//           </div>

//           <button type="submit" className="auth-submit-btn" disabled={isLoading}>
//             {isLoading ? 'Creating Account...' : 'Sign Up'}
//           </button>
//         </form>

//         <div className="auth-footer">
//           Already have an account? <Link to="/login">Login here</Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Signup;


// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { signup, checkUsername, clearError } from '../redux/slices/authSlice';
// import { useNavigate, Link } from 'react-router-dom';
// import './Signup.css';

// const avatars = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];

// const securityQuestions = [
//   'What is your favorite book?',
//   'What city were you born in?',
//   "What is your mother's maiden name?",
//   'What was the name of your first pet?',
//   'What is your favorite movie?',
//   'What was your childhood nickname?',
//   'What is your favorite food?',
//   'What street did you grow up on?'
// ];

// const Signup = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const { isLoading, error, isAuthenticated } = useSelector(
//     (state) => state.auth
//   );

//   const [formData, setFormData] = useState({
//     name: '',
//     username: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     avatar: 1,
//     securityQuestion: securityQuestions[0],
//     securityAnswer: ''
//   });

//   const [errors, setErrors] = useState({});
//   const [checkingUsername, setCheckingUsername] = useState(false);
//   const [usernameAvailable, setUsernameAvailable] = useState(null);
//   const [showAvatarModal, setShowAvatarModal] = useState(false)

//   /* ---------------- Redirect on success ---------------- */
//   useEffect(() => {
//     if (isAuthenticated) {
//       navigate('/dashboard');
//     }
//   }, [isAuthenticated, navigate]);

//   /* ---------------- Clear redux error on unmount ---------------- */
//   useEffect(() => {
//     return () => {
//       dispatch(clearError());
//     };
//   }, [dispatch]);

//   /* ---------------- Username availability check ---------------- */
//   useEffect(() => {
//     const checkAvailability = async () => {
//       if (formData.username.length >= 3) {
//         setCheckingUsername(true);
//         try {
//           const res = await dispatch(
//             checkUsername(formData.username)
//           ).unwrap();
//           setUsernameAvailable(res.available);
//         } catch {
//           setUsernameAvailable(null);
//         } finally {
//           setCheckingUsername(false);
//         }
//       } else {
//         setUsernameAvailable(null);
//       }
//     };

//     const timeout = setTimeout(checkAvailability, 500);
//     return () => clearTimeout(timeout);
//   }, [formData.username, dispatch]);

//   /* ---------------- Handle change ---------------- */
//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setFormData(prev => ({ ...prev, [name]: value }));

//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const handleAvatarSelect = (num) => {
//     setFormData(prev => ({ ...prev, avatar: num }));
//   };

//   /* ---------------- Validation ---------------- */
//   const validateForm = () => {
//     const newErrors = {};

//     if (!formData.name.trim()) {
//       newErrors.name = 'Name is required';
//     }

//     if (!formData.username.trim()) {
//       newErrors.username = 'Username is required';
//     } else if (formData.username.length < 3) {
//       newErrors.username = 'Username must be at least 3 characters';
//     } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
//       newErrors.username = 'Only letters, numbers & underscores allowed';
//     } else if (usernameAvailable === false) {
//       newErrors.username = 'Username is already taken';
//     }

//     if (!formData.email.trim()) {
//       newErrors.email = 'Email is required';
//     } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//       newErrors.email = 'Invalid email';
//     }

//     if (!formData.password) {
//       newErrors.password = 'Password is required';
//     } else if (formData.password.length < 6) {
//       newErrors.password = 'Minimum 6 characters';
//     }

//     if (formData.password !== formData.confirmPassword) {
//       newErrors.confirmPassword = 'Passwords do not match';
//     }

//     if (!formData.securityAnswer.trim()) {
//       newErrors.securityAnswer = 'Security answer is required';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   /* ---------------- Submit ---------------- */
//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (!validateForm()) return;

//     const { confirmPassword, ...signupData } = formData;
//     dispatch(signup(signupData));
//   };

//   /* ---------------- UI ---------------- */
//   return (
//     <div className="signup-page">
//       <div className="signup-card">
//         <h1>Create Account</h1>

//         {error && <div className="error-message">{error}</div>}

//         <form onSubmit={handleSubmit} className="signup-form two-column">
//           {/* LEFT */}
//           <div className="form-left">

//             <div className="form-group">
//               <label>Full Name *</label>
//               <input name="name" value={formData.name} onChange={handleChange} />
//               {errors.name && <span className="error-text">{errors.name}</span>}
//             </div>

//             <div className="form-group">
//               <label>Username *</label>
//               <div className="input-with-status">
//                 <input
//                   name="username"
//                   value={formData.username}
//                   onChange={handleChange}
//                 />
//                 {checkingUsername && <span>Checking...</span>}
//                 {usernameAvailable === true && <span className="available">✓</span>}
//                 {usernameAvailable === false && <span className="taken">✗</span>}
//               </div>
//               {errors.username && <span className="error-text">{errors.username}</span>}
//             </div>

//             <div className="form-group">
//               <label>Email *</label>
//               <input name="email" value={formData.email} onChange={handleChange} />
//               {errors.email && <span className="error-text">{errors.email}</span>}
//             </div>

//             <div className="form-group">
//               <label>Password *</label>
//               <input type="password" name="password" value={formData.password} onChange={handleChange} />
//               {errors.password && <span className="error-text">{errors.password}</span>}
//             </div>

//             <div className="form-group">
//               <label>Confirm Password *</label>
//               <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
//               {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
//             </div>

//             {/* Security */}
//             <div className="form-group">
//               <label>Security Question *</label>
//               <select
//                 name="securityQuestion"
//                 value={formData.securityQuestion}
//                 onChange={handleChange}
//               >
//                 {securityQuestions.map(q => (
//                   <option key={q} value={q}>{q}</option>
//                 ))}
//               </select>
//             </div>

//             <div className="form-group">
//               <label>Security Answer *</label>
//               <input
//                 name="securityAnswer"
//                 value={formData.securityAnswer}
//                 onChange={handleChange}
//               />
//               {errors.securityAnswer && (
//                 <span className="error-text">{errors.securityAnswer}</span>
//               )}
//             </div>

//             <button type="submit" disabled={isLoading || checkingUsername}>
//               {isLoading ? 'Creating Account...' : 'Sign Up'}
//             </button>
//           </div>

//           {/* RIGHT */}
//           <div className="form-group full">
//             <label>Avatar</label>

//             <button
//               type="button"
//               className="avatar-trigger"
//               onClick={() => setShowAvatarModal(true)}
//             >
//               {selectedAvatar ? (
//                 <img src={selectedAvatar} alt="avatar" />
//               ) : (
//                 <span>Select Avatar</span>
//               )}
//           </button>
// </div>
//         </form>

//         {showAvatarModal && (
//   <div className="avatar-modal-backdrop">
//     <div className="avatar-modal">
//       <div className="avatar-modal-header">
//         <h3>Select Avatar</h3>
//         <button onClick={() => setShowAvatarModal(false)}>&times;</button>
//       </div>

//       <div className="avatar-grid">
//         {avatars.map((avatar) => (
//           <div
//             key={avatar}
//             className={`avatar-option ${
//               selectedAvatar === avatar ? 'selected' : ''
//             }`}
//             onClick={() => {
//               setSelectedAvatar(avatar);
//               setShowAvatarModal(false);
//             }}
//           >
//             <img src={avatar} alt="avatar" />
//           </div>
//         ))}
//       </div>
//     </div>
//   </div>
// )}

//         <p className="signup-footer">
//           Already have an account? <Link to="/login">Login</Link>
//         </p>
//       </div>
//     </div>
//   );
// };

// export default Signup;

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signup, checkUsername, clearError } from '../redux/slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css';
import { useRef } from 'react';

const avatars = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19];

const securityQuestions = [
  'What is your favorite book?',
  'What city were you born in?',
  "What is your mother's maiden name?",
  'What was the name of your first pet?',
  'What is your favorite movie?',
  'What was your childhood nickname?',
  'What is your favorite food?',
  'What street did you grow up on?'
];

const Signup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const rafRef = useRef(null);

  const { isLoading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: 1,
    securityQuestion: securityQuestions[0],
    securityAnswer: ''
  });

  const [errors, setErrors] = useState({});
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  /* ---------------- Redirect on success ---------------- */
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  /* ---------------- Clear redux error on unmount ---------------- */
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  /* ---------------- Username availability check ---------------- */
  useEffect(() => {
    const checkAvailability = async () => {
      if (formData.username.length >= 3) {
        setCheckingUsername(true);
        try {
          const res = await dispatch(
            checkUsername(formData.username)
          ).unwrap();
          setUsernameAvailable(res.available);
        } catch {
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(null);
      }
    };

    const timeout = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeout);
  }, [formData.username, dispatch]);

  /* ---------------- Handle change ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAvatarSelect = (num) => {
    setFormData(prev => ({ ...prev, avatar: num }));
    setShowAvatarModal(false);
  };

  /* ---------------- Validation ---------------- */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Only letters, numbers & underscores allowed';
    } else if (usernameAvailable === false) {
      newErrors.username = 'Username is already taken';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Minimum 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.securityAnswer.trim()) {
      newErrors.securityAnswer = 'Security answer is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- Submit ---------------- */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const { confirmPassword, ...signupData } = formData;
    dispatch(signup(signupData));
  };

  /* ---------------- Slider handlers ---------------- */
  const handleSliderStart = (e) => {
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    if (isLoading || checkingUsername) return;
    setIsDragging(true);
  };

  const handleSliderMove = (e) => {
  if (!isDragging || !sliderRef.current) return;

  if (rafRef.current) return;

  rafRef.current = requestAnimationFrame(() => {
    const rect = sliderRef.current.getBoundingClientRect();

    const clientX = e.type.includes("touch")
      ? e.touches[0].clientX
      : e.clientX;

    const newPosition = Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100)
    );

    setSliderPosition(newPosition);

    if (newPosition >= 90) {
      setIsDragging(false);
      setSliderPosition(100);
      handleSubmit(e);
    }

    rafRef.current = null;
  });
};
useEffect(() => {
  return () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };
}, []);

  const handleSliderEnd = () => {
  document.body.style.userSelect = "";
  document.body.style.webkitUserSelect = "";

  if (sliderPosition < 90) {
    setSliderPosition(0);
  }
  setIsDragging(false);
};

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e) => handleSliderMove(e);
      const handleMouseUp = () => handleSliderEnd();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('touchend', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleMouseMove);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, sliderPosition]);

  /* ---------------- UI ---------------- */
  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* LEFT SIDE - IMAGE */}
        <div className="signup-image-section">
          <div className="image-overlay">
            {/* <h2>Welcome to StuddyBuddy</h2> */}
            {/* <p>Start your learning journey today</p> */}
          </div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <div className="signup-form-section">
          <div className="form-wrapper">
            <h1>Welcome to StuddyBuddy</h1>
            <p className="subtitle">Join thousands of learners worldwide</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="signup-form">
              
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Username *</label>
                <div className="input-with-status">
                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                  />
                  {checkingUsername && <span className="status-text checking">Checking...</span>}
                  {usernameAvailable === true && <span className="status-icon available">✓</span>}
                  {usernameAvailable === false && <span className="status-icon taken">✗</span>}
                </div>
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input 
                  name="email" 
                  type="email"
                  value={formData.email} 
                  onChange={handleChange}
                  placeholder="your@email.com"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                  placeholder="Re-enter password"
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>

              <div className="form-group">
                <label>Avatar *</label>
                <button
                  type="button"
                  className="avatar-select-btn"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <div className="avatar-preview">
                    <img 
                      src={`/avatars/avatar-${formData.avatar}.png`} 
                      alt="Selected avatar" 
                    />
                  </div>
                  <span>Click to choose avatar</span>
                </button>
              </div>

              <div className="form-group">
                <label>Security Question *</label>
                <div className="select-wrapper">
                  <select
                    name="securityQuestion"
                    value={formData.securityQuestion}
                    onChange={handleChange}
                  >
                    {securityQuestions.map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Security Answer *</label>
                <input
                  name="securityAnswer"
                  value={formData.securityAnswer}
                  onChange={handleChange}
                  placeholder="Your answer"
                />
                {errors.securityAnswer && (
                  <span className="error-text">{errors.securityAnswer}</span>
                )}
              </div>

              {/* SLIDER SUBMIT BUTTON */}
              <div className="slider-submit-container">
                <div
                  ref={sliderRef} 
                  // className="slider-track"
                  className={`slider-track ${isDragging ? "dragging" : ""}`}
                  onMouseDown={handleSliderStart}
                  onTouchStart={handleSliderStart}
                >
                  <div 
                    className="slider-fill"
                    style={{ width: `${sliderPosition}%` }}
                  ></div>
                  <div 
                    className="slider-thumb"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <span className="slider-arrow">→</span>
                  </div>
                  <span className="slider-text">
                    {sliderPosition >= 90 ? 'Creating Account...' : 'Slide to Sign Up'}
                  </span>
                </div>
              </div>

            </form>

            <p className="signup-footer">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>

      {/* AVATAR MODAL */}
      {showAvatarModal && (
        <div className="avatar-modal-backdrop" onClick={() => setShowAvatarModal(false)}>
          <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="avatar-modal-header">
              <h3>Choose Your Avatar</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAvatarModal(false)}
              >
                ×
              </button>
            </div>

            <div className="avatar-grid">
              {avatars.map((avatar) => (
                <div
                  key={avatar}
                  className={`avatar-option ${
                    formData.avatar === avatar ? 'selected' : ''
                  }`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  <img 
                    src={`/avatars/avatar-${avatar}.png`} 
                    alt={`Avatar ${avatar}`} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
