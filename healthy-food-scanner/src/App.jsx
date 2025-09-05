import React, { useState, useEffect, useMemo, useRef } from 'react';

// --- ZXing Barcode Scanner Library ---
// We will load this library dynamically from a CDN
const ZXING_CDN = 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.4/es2015/zxing-browser.min.js';

// --- MOCK DATA (Fallback for offline/demo) ---
const mockFoodData = {
  '8901030910248': { // Example: Maggi Noodles barcode
    name: 'Maggi 2-Minute Noodles',
    image: 'https://images.openfoodfacts.org/images/products/890/103/091/0248/front_en.150.400.jpg',
    score: 28,
    nutrition: { calories: '402 kcal', sugar: '1.2g', fat: '15.7g', protein: '8g' },
    warnings: ['High in Sodium', 'Processed Food'],
    alternatives: [ { name: 'Whole Wheat Pasta', image: 'https://images.unsplash.com/photo-1621996346565-e326a22e020e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80' } ],
  },
};

// --- ICONS (as SVG components) ---
const ScanIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></svg> );
const UploadIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> );
const CalorieIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4.5c3 3 1.9 9.5-2.5 13.5s-10.5 5.5-13.5 2.5 5.5-10.5 2.5-13.5c-3-3-1.9-9.5 2.5-13.5s10.5-5.5 13.5-2.5z" /><path d="M12 12c-2-2-2-5 0-7" /></svg> );
const SugarIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" /><path d="M21 8H3" /><path d="m18 8-3-3" /><path d="m6 8 3-3" /></svg> );
const FatIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.8 12.5C19.5 11.6 20 10.6 20 9.5C20 7.6 18.4 6 16.5 6C15.2 6 14.1 6.7 13.5 7.8C13 6.7 11.8 6 10.5 6C8.6 6 7 7.6 7 9.5c0 1.1.5 2.1 1.2 2.9L12 17l5.8-4.5z" /><path d="M10 3.2C7.9 4.3 6 6.5 6 9.5c0 1.6.8 3.1 2.1 4.1" /><path d="M14 3.2c2.1 1.1 4 3.3 4 6.3 0 1.6-.8 3.1-2.1 4.1" /></svg> );
const ProteinIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.2 2.1c.1.1.2.1.3.2l3 3c.2.2.3.5.3.8v1.8c0 .3-.1.5-.3.7l-3 3c-.1.1-.2.1-.3.2h-1.4c-.1 0-.2-.1-.3-.2l-3-3c-.2-.2-.3-.5-.3-.7V7c0-.3.1-.5.3-.7l3-3c.1-.1.2-.1.3-.2h1.4Z" /><path d="m18.7 10.8-3-3" /><path d="m5.3 10.8 3-3" /><path d="m12.2 21.9c.1-.1.2-.1.3-.2l3-3c.2-.2.3-.5.3-.8v-1.8c0-.3-.1-.5-.3-.7l-3-3c-.1-.1-.2-.1-.3-.2h-1.4c-.1 0-.2.1-.3.2l-3 3c-.2.2-.3.5-.3-.7v1.8c0 .3.1.5.3.7l3 3c.1.1.2.1.3.2h1.4Z" /><path d="m18.7 18.2-3-3" /><path d="m5.3 18.2 3-3" /></svg> );
const WarningIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg> );
const HistoryIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const ReportIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>);
const ProfileIcon = ({ className }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);


// --- HELPER FUNCTIONS ---
const getScoreColor = (score) => { if (score >= 75) return 'text-green-500'; if (score >= 40) return 'text-yellow-500'; return 'text-red-500'; };
const getScoreBgColor = (score) => { if (score >= 75) return 'bg-green-500'; if (score >= 40) return 'bg-yellow-500'; return 'bg-red-500'; };
const getScoreGradient = (score) => { if (score >= 75) return { from: '#10B981', to: '#6EE7B7' }; if (score >= 40) return { from: '#F59E0B', to: '#FBBF24' }; return { from: '#EF4444', to: '#F87171' }; };

// --- API Data Transformation ---
const nutriscoreGradeToScore = (grade) => {
    const gradeMap = { 'a': 95, 'b': 75, 'c': 50, 'd': 30, 'e': 10 };
    return gradeMap[grade?.toLowerCase()] || 40; // Default score if grade not found
};

const transformApiData = (apiProduct, barcode) => {
    const nutriments = apiProduct.nutriments || {};
    const warnings = [];
    if (apiProduct.nutrient_levels?.sugar === 'high') warnings.push('High Sugar Content');
    if (apiProduct.nutrient_levels?.fat === 'high') warnings.push('High Fat Content');
    if (apiProduct.nutrient_levels?.salt === 'high') warnings.push('High Sodium Content');

    return {
        id: barcode,
        name: apiProduct.product_name_en || apiProduct.product_name || 'Unknown Product',
        image: apiProduct.image_front_url || 'https://placehold.co/600x400/2D3748/FFFFFF?text=No+Image',
        score: nutriscoreGradeToScore(apiProduct.nutriscore_grade),
        nutrition: {
            calories: `${Math.round(nutriments['energy-kcal_100g'] || 0)} kcal`,
            sugar: `${nutriments.sugars_100g?.toFixed(1) || 0}g`,
            fat: `${nutriments.fat_100g?.toFixed(1) || 0}g`,
            protein: `${nutriments.proteins_100g?.toFixed(1) || 0}g`,
        },
        warnings,
        alternatives: [], // Finding alternatives requires a more complex logic
    };
};


// --- SCREEN COMPONENTS ---

const SplashScreen = ({ onFinish }) => {
  useEffect(() => { const timer = setTimeout(() => onFinish(), 2500); return () => clearTimeout(timer); }, [onFinish]);
  return ( <div className="flex flex-col items-center justify-center h-full bg-gray-900 animate-fade-in"><div className="relative flex items-center justify-center"><ScanIcon className="text-green-500 w-32 h-32" /><div className="absolute text-green-500 text-5xl font-bold"><span role="img" aria-label="apple">🍏</span></div></div><h1 className="text-4xl font-bold text-gray-100 mt-4">Healthy Food Scanner</h1><p className="text-lg text-gray-400 mt-2">Scan Smart. Behtar Khayein.</p></div> );
};

const HomeScreen = ({ onUpload, setScreen }) => {
    const fileInputRef = useRef(null);
    const handleUploadClick = () => { fileInputRef.current.click(); };
    const handleFileChange = (event) => { if (event.target.files[0]) { alert("Image upload abhi-tak implement nahi hua hai. Kripya live camera scan ka istemal karein."); } };
    
    return ( <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-900 text-center relative overflow-hidden"><span className="absolute -top-10 -left-10 text-8xl opacity-10" role="img" aria-label="avocado">🥑</span><span className="absolute -bottom-12 -right-8 text-9xl opacity-10" role="img" aria-label="carrot">🥕</span><span className="absolute top-1/4 -right-10 text-7xl opacity-10" role="img" aria-label="broccoli">🥦</span><h2 className="text-3xl font-bold text-gray-200 mb-4">Scan Karne Ke Liye Taiyaar?</h2><p className="text-gray-400 mb-12 max-w-sm">Product ke health details janne ke liye barcode scan karein aur behtar alternatives khojein.</p><button onClick={() => setScreen('scanner')} className="flex items-center justify-center w-full max-w-xs px-8 py-5 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"><ScanIcon className="w-8 h-8 mr-4" /><span className="text-xl font-bold">Food Scan Karein</span></button><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/><button onClick={handleUploadClick} className="flex items-center justify-center mt-6 text-green-500 font-semibold hover:text-green-400 transition-colors"><UploadIcon className="w-5 h-5 mr-2" />Image Upload Karein</button></div> );
};

const ScannerScreen = ({ onScanSuccess, onCancel }) => {
    const videoRef = useRef(null);
    const [status, setStatus] = useState('Camera shuru ho raha hai...');
    const codeReaderRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        const loadScanner = async () => {
            try {
                // Dynamically import the library
                const { BrowserMultiFormatReader } = await import(ZXING_CDN);
                const codeReader = new BrowserMultiFormatReader();
                codeReaderRef.current = codeReader;

                if (!isMounted) return;

                const videoInputDevices = await codeReader.listVideoInputDevices();
                if (videoInputDevices.length > 0) {
                    setStatus('Barcode ko frame ke beech rakhein...');
                    codeReader.decodeFromVideoDevice(videoInputDevices[0].deviceId, videoRef.current, (result, err) => {
                        if (result) {
                            onScanSuccess(result.getText());
                        }
                        if (err && !(err instanceof window.ZXing.NotFoundException)) {
                            console.error(err);
                            setStatus('Scan mein error hua.');
                        }
                    });
                } else {
                    setStatus('Koi camera nahi mila.');
                }
            } catch (err) {
                console.error("Camera access error:", err);
                setStatus('Camera access anumat nahi hai.');
            }
        };

        loadScanner();

        return () => {
            isMounted = false;
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
        };
    }, [onScanSuccess]);

    return (
        <div className="relative w-full h-full bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-3/4 max-w-sm h-1/3 border-4 border-dashed border-green-500 rounded-lg flex items-center justify-center overflow-hidden">
                    <div className="w-full relative h-full">
                        <div className="absolute top-0 w-full bg-red-500 animate-scan-line"></div>
                    </div>
                </div>
                <p className="absolute bottom-24 text-white text-lg font-semibold bg-black/50 p-2 rounded">{status}</p>
            </div>
            <button onClick={onCancel} className="absolute top-5 left-5 bg-gray-800/70 backdrop-blur-sm p-3 rounded-full text-white hover:bg-gray-700 transition">Cancel</button>
        </div>
    );
};

const HealthScoreMeter = ({ score }) => {
    const circumference = 2 * Math.PI * 52; 
    const offset = circumference - (score / 100) * circumference; 
    const colors = getScoreGradient(score); 
    return ( 
        <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 120 120">
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={colors.from} />
                        <stop offset="100%" stopColor={colors.to} />
                    </linearGradient>
                </defs>
                <circle className="text-gray-700" strokeWidth="12" stroke="currentColor" fill="transparent" r="52" cx="60" cy="60" />
                <circle stroke="url(#gradient)" className="transition-all duration-1000 ease-out" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" fill="transparent" r="52" cx="60" cy="60" transform="rotate(-90 60 60)" />
            </svg>
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${getScoreColor(score)}`}>
                <span className="text-5xl font-bold">{score}</span>
                <span className="text-sm font-semibold text-gray-400">/ 100</span>
            </div>
        </div> 
    ); 
};

const ScanResultScreen = ({ item, onBack }) => { 
    if (!item) { 
        return ( 
            <div className="p-4 bg-gray-900 min-h-full flex flex-col items-center justify-center text-white">
                <p className="text-xl">Product not found.</p>
                <button onClick={onBack} className="mt-4 bg-green-500 px-4 py-2 rounded-lg">Scan Again</button>
            </div> 
        ); 
    } 
    return ( 
        <div className="p-4 bg-gray-900 min-h-full animate-slide-in">
            <div className="relative">
                <img src={item.image} alt={item.name} className="w-full h-48 object-cover rounded-2xl shadow-lg" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/2D3748/FFFFFF?text=No+Image'; }} />
                <button onClick={onBack} className="absolute top-3 left-3 bg-gray-800/70 backdrop-blur-sm p-2 rounded-full text-gray-200 hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-100 mt-4">{item.name}</h1>
            <div className="flex justify-center my-6">
                <HealthScoreMeter score={item.score} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-800 p-4 rounded-xl shadow-md"><CalorieIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" /><p className="text-sm text-gray-400">Calories</p><p className="font-bold text-lg text-gray-100">{item.nutrition.calories}</p></div>
                <div className="bg-gray-800 p-4 rounded-xl shadow-md"><SugarIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" /><p className="text-sm text-gray-400">Sugar</p><p className="font-bold text-lg text-gray-100">{item.nutrition.sugar}</p></div>
                <div className="bg-gray-800 p-4 rounded-xl shadow-md"><FatIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" /><p className="text-sm text-gray-400">Fat</p><p className="font-bold text-lg text-gray-100">{item.nutrition.fat}</p></div>
                <div className="bg-gray-800 p-4 rounded-xl shadow-md"><ProteinIcon className="w-8 h-8 text-green-500 mx-auto mb-2" /><p className="text-sm text-gray-400">Protein</p><p className="font-bold text-lg text-gray-100">{item.nutrition.protein}</p></div>
            </div>
            {item.warnings.length > 0 && ( <div className="mt-6">{item.warnings.map((warning, index) => ( <div key={index} className="flex items-center bg-red-900/50 text-red-300 p-3 rounded-lg mb-2 shadow-sm"><WarningIcon className="w-6 h-6 mr-3"/><p className="font-semibold">{warning}</p></div> ))}</div> )}
            {item.alternatives.length > 0 && ( <div className="mt-8 mb-20"><h2 className="text-2xl font-bold text-gray-100">Better Alternatives</h2><div className="mt-4 space-y-3">{item.alternatives.map((alt, index) => ( <div key={index} className="flex items-center bg-gray-800 p-3 rounded-xl shadow-md"><img src={alt.image} alt={alt.name} className="w-16 h-16 object-cover rounded-lg" /><p className="font-semibold text-gray-200 ml-4">{alt.name}</p></div> ))}</div></div> )}
        </div> 
    ); 
};

const HistoryScreen = ({ history, onItemSelect }) => ( 
    <div className="p-4 bg-gray-900 min-h-full">
        <h1 className="text-3xl font-bold text-gray-100 mb-6">Scan History</h1>
        {history.length === 0 ? ( 
            <div className="text-center text-gray-500 mt-20">
                <ScanIcon className="w-16 h-16 mx-auto text-gray-700 mb-4" />
                <p className="font-semibold">No items scanned yet.</p><p>Your history will appear here.</p>
            </div> 
        ) : ( 
            <div className="space-y-3 mb-20">{history.map((item, index) => ( 
                <button key={index} onClick={() => onItemSelect(item.id)} className="w-full flex items-center bg-gray-800 p-4 rounded-xl shadow-md text-left transition transform hover:scale-105">
                    <div className={`w-3 h-3 rounded-full ${getScoreBgColor(item.score)}`}></div>
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg ml-4" />
                    <div className="flex-grow ml-4">
                        <p className="font-bold text-gray-100">{item.name}</p>
                        <p className="text-sm text-gray-400">Health Score: <span className={`${getScoreColor(item.score)} font-semibold`}>{item.score}</span></p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button> 
            ))}
            </div> 
        )}
    </div> 
);

const WeeklyReportScreen = ({ history }) => { 
    const reportData = useMemo(() => { 
        const totalItems = history.length; 
        if (totalItems === 0) { return { averageScore: 0, totalItems: 0, suggestion: "Scan some items to get your first report!" }; } 
        const totalScore = history.reduce((acc, item) => acc + item.score, 0); 
        const averageScore = Math.round(totalScore / totalItems); 
        let suggestion = "You're doing great! Keep scanning healthy items."; 
        const lowScoreItems = history.filter(item => item.score < 40).length; 
        if (lowScoreItems / totalItems > 0.5) { suggestion = "Try reducing sugary drinks and snacks this week."; } 
        else if (averageScore < 60) { suggestion = "Focus on finding healthier alternatives for your favorite snacks."; } 
        return { averageScore, totalItems, suggestion }; 
    }, [history]); 
    
    return ( 
        <div className="p-4 bg-gray-900 min-h-full">
            <h1 className="text-3xl font-bold text-gray-100 mb-6">Weekly Report</h1>
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                <p className="text-gray-400">Summary</p>
                <p className="text-lg mt-2 text-gray-200">This week you scanned <span className="font-bold text-green-400">{reportData.totalItems} items</span>.</p>
                <p className="text-lg text-gray-200">Your average score is <span className={`font-bold ${getScoreColor(reportData.averageScore)}`}>{reportData.averageScore}/100</span>.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg mt-6">
                <h2 className="font-bold text-xl text-gray-200 mb-4">Score Distribution</h2>
                {history.length > 0 ? ( 
                    <div className="w-full h-48 bg-gray-700 rounded-lg p-2 flex items-end space-x-2">
                        {history.slice(0, 10).map((item, index) => ( 
                            <div key={index} className="flex-1 flex flex-col items-center group">
                                <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">{item.score}</div>
                                <div className={`w-full rounded-t-md ${getScoreBgColor(item.score)} transition-all duration-500`} style={{ height: `${item.score}%` }}></div>
                                <div className="w-3 h-3 rounded-full mt-1 bg-gray-500"></div>
                            </div> 
                        ))}
                    </div> 
                ) : ( 
                    <p className="text-gray-500 text-center py-10">No data for the graph yet.</p> 
                )}
            </div>
            <div className="bg-green-900/50 border-l-4 border-green-500 text-green-300 p-4 rounded-r-lg mt-6 shadow-md">
                <p className="font-bold">Suggestion</p>
                <p>{reportData.suggestion}</p>
            </div>
        </div> 
    ); 
};

const ProfileScreen = ({ profile, setProfile }) => {
    const handleInputChange = (e) => { 
        const { name, value } = e.target; 
        setProfile(prev => ({ ...prev, [name]: value })); 
    }; 
    return ( 
        <div className="p-4 bg-gray-900 min-h-full">
            <h1 className="text-3xl font-bold text-gray-100 mb-6">Your Profile</h1>
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg space-y-6">
                <div>
                    <label htmlFor="age" className="block text-sm font-medium text-gray-300">Age</label>
                    <input type="number" name="age" id="age" value={profile.age} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                </div>
                <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-gray-300">Weight (kg)</label>
                    <input type="number" name="weight" id="weight" value={profile.weight} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm text-white focus:outline-none focus:ring-green-500 focus:border-green-500"/>
                </div>
                <div>
                    <label htmlFor="goal" className="block text-sm font-medium text-gray-300">Health Goal</label>
                    <select id="goal" name="goal" value={profile.goal} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-700 border-gray-600 text-white focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md">
                        <option>Weight Loss</option>
                        <option>Fitness</option>
                        <option>Diabetic Friendly</option>
                        <option>General Health</option>
                    </select>
                </div>
                <button className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors shadow-md">Save Profile</button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-6">Personalizing your profile helps us provide more relevant warnings and suggestions.</p>
        </div> 
    ); 
};

const BottomNav = ({ activeScreen, setActiveScreen }) => { 
    const navItems = [ 
        { id: 'home', label: 'Scanner', icon: <ScanIcon className="w-7 h-7 mb-1" /> }, 
        { id: 'history', label: 'History', icon: <HistoryIcon className="w-7 h-7 mb-1" /> }, 
        { id: 'report', label: 'Report', icon: <ReportIcon className="w-7 h-7 mb-1" /> }, 
        { id: 'profile', label: 'Profile', icon: <ProfileIcon className="w-7 h-7 mb-1" /> }, 
    ]; 
    return ( 
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 flex justify-around items-center">
            {navItems.map(item => ( 
                <button key={item.id} onClick={() => setActiveScreen(item.id)} className={`flex flex-col items-center justify-center transition-colors duration-300 ${activeScreen === item.id ? 'text-green-500' : 'text-gray-400'}`}>
                    {item.icon}
                    <span className="text-xs font-bold">{item.label}</span>
                </button> 
            ))}
        </div> 
    ) 
};

const LoadingSpinner = () => ( <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center z-50"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-500"></div><p className="text-white mt-4">Product details fetch ho rahe hain...</p></div> );


// --- MAIN APP COMPONENT ---
export default function App() {
  const [screen, setScreen] = useState('splash');
  const [activeItem, setActiveItem] = useState(null);
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState({ age: '', weight: '', goal: 'General Health' });
  const [isLoading, setIsLoading] = useState(false);
  
  const handleScan = async (barcode) => {
    setScreen('home'); // Go back to home to show loading spinner over it
    setIsLoading(true);

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        const productData = transformApiData(data.product, barcode);
        setActiveItem(productData);
        setHistory(prev => [productData, ...prev.filter(h => h.id !== barcode)]);
      } else {
        // Product not found, maybe show a fallback from mock data or an error
        setActiveItem(mockFoodData[barcode] || null); // Fallback to mock
      }
    } catch (error) {
      console.error("Failed to fetch product data:", error);
      setActiveItem(mockFoodData[barcode] || null); // Fallback to mock on error
    } finally {
      setIsLoading(false);
      setScreen('scanResult');
    }
  };

  const handleItemSelect = (barcode) => {
    const item = history.find(h => h.id === barcode) || mockFoodData[barcode];
    if (item) {
        setActiveItem(item);
        setScreen('scanResult');
    }
  };

  const renderScreen = () => {
    switch (screen) {
      case 'splash': return <SplashScreen onFinish={() => setScreen('home')} />;
      case 'home': return <HomeScreen setScreen={setScreen} />;
      case 'scanner': return <ScannerScreen onScanSuccess={handleScan} onCancel={() => setScreen('home')} />;
      case 'scanResult': return <ScanResultScreen item={activeItem} onBack={() => setScreen('home')} />;
      case 'history': return <HistoryScreen history={history} onItemSelect={handleItemSelect}/>;
      case 'report': return <WeeklyReportScreen history={history} />;
      case 'profile': return <ProfileScreen profile={profile} setProfile={setProfile} />;
      default: return <HomeScreen setScreen={setScreen} />;
    }
  };

  return (
    <div className="w-full h-full font-sans bg-gray-900 antialiased">
        <style>{`.animate-scan-line { height: 100%; animation: scan-line-anim 2.5s infinite linear; background: linear-gradient(to bottom, transparent, rgba(239, 68, 68, 0.7), transparent); } @keyframes scan-line-anim { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }`}</style>
        <main className="h-full relative">
            {isLoading && <LoadingSpinner />}
            {renderScreen()}
        </main>
        {screen !== 'splash' && screen !== 'scanResult' && screen !== 'scanner' && <BottomNav activeScreen={screen} setActiveScreen={setScreen} />}
    </div>
  );
}

