import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Upload, 
  BookOpen, 
  Plus, 
  Trash2, 
  Download, 
  Save, 
  Send, 
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  PlusCircle,
  Layers,
  FileDown,
  FileType
} from 'lucide-react';
import { generateQuestionsFromPrompt, analyzeCurriculum } from '../services/geminiService';
import { savePaperToDB, getPapersForFaculty } from '../services/mockServices';
import { exportToPDF, exportToDocx } from '../services/exportService';
import { Question, QuestionPaper, PaperStatus, QuestionType, Difficulty, ViewType } from '../types';

interface FacultyDashboardProps {
    userId: string;
    userName: string;
    currentView: ViewType;
}

const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ userId, userName, currentView }) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'upload' | 'curriculum'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paperTitle, setPaperTitle] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [customQuestion, setCustomQuestion] = useState<Partial<Question>>({ type: QuestionType.SHORT_ANSWER, difficulty: Difficulty.MEDIUM, marks: 5 });

  const [myPapers, setMyPapers] = useState<QuestionPaper[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
      if (currentView === 'my_papers') {
          loadHistory();
      }
  }, [currentView]);

  const loadHistory = async () => {
      setHistoryLoading(true);
      const papers = await getPapersForFaculty(userId);
      setMyPapers(papers);
      setHistoryLoading(false);
  }

  const handlePromptGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const questions = await generateQuestionsFromPrompt(prompt, 5, Difficulty.MEDIUM);
      setGeneratedQuestions(prev => [...prev, ...questions]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'paper' | 'curriculum') => {
    if (e.target.files && e.target.files[0]) {
      setIsLoading(true);
      setTimeout(async () => {
        if (type === 'curriculum') {
             const topics = await analyzeCurriculum("Mock curriculum text");
             const questions = await generateQuestionsFromPrompt(`Questions based on: ${topics.join(', ')}`, 5);
             setGeneratedQuestions(prev => [...prev, ...questions]);
        } else {
             const mockExtracted: Question = {
                 id: `ocr-${Date.now()}`,
                 text: "Extracted: What is the time complexity of QuickSort?",
                 type: QuestionType.MCQ,
                 difficulty: Difficulty.MEDIUM,
                 options: ["O(n)", "O(n log n)", "O(n^2)", "O(1)"],
                 correctAnswer: "O(n log n)",
                 marks: 1
             };
             setGeneratedQuestions(prev => [...prev, mockExtracted]);
        }
        setIsLoading(false);
      }, 1500);
    }
  };

  const handleAddCustomQuestion = () => {
      if (!customQuestion.text) return;
      
      const newQ: Question = {
          id: `custom-${Date.now()}`,
          text: customQuestion.text,
          type: customQuestion.type || QuestionType.SHORT_ANSWER,
          difficulty: customQuestion.difficulty || Difficulty.MEDIUM,
          marks: customQuestion.marks || 5,
          correctAnswer: customQuestion.correctAnswer || '',
          options: customQuestion.type === QuestionType.MCQ ? customQuestion.options || ['A', 'B', 'C', 'D'] : []
      };
      setGeneratedQuestions(prev => [...prev, newQ]);
      setShowAddModal(false);
      setCustomQuestion({ type: QuestionType.SHORT_ANSWER, difficulty: Difficulty.MEDIUM, marks: 5 });
  };

  const handleRemoveQuestion = (id: string) => {
    setGeneratedQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSaveForApproval = async () => {
    if (!paperTitle || generatedQuestions.length === 0) {
        return;
    }
    setIsLoading(true);
    const paper: QuestionPaper = {
        id: `paper-${Date.now()}`,
        title: paperTitle,
        courseCode: "CS-TEMP",
        facultyId: userId,
        facultyName: userName,
        createdAt: new Date().toISOString(),
        status: PaperStatus.PENDING_APPROVAL,
        questions: generatedQuestions,
        totalMarks: generatedQuestions.reduce((acc, q) => acc + q.marks, 0),
        durationMinutes: 90
    };
    
    await savePaperToDB(paper);
    setIsLoading(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleExport = (type: 'pdf' | 'docx' | 'txt') => {
    const paper: QuestionPaper = {
        id: `paper-export-${Date.now()}`,
        title: paperTitle || 'Untitled Paper',
        courseCode: "CS-TEMP",
        facultyId: userId,
        facultyName: userName,
        createdAt: new Date().toISOString(),
        status: PaperStatus.PENDING_APPROVAL,
        questions: generatedQuestions,
        totalMarks: generatedQuestions.reduce((acc, q) => acc + q.marks, 0),
        durationMinutes: 90
    };

    if (type === 'pdf') {
        exportToPDF(paper);
    } else if (type === 'docx') {
        exportToDocx(paper);
    } else {
        let content = `PAPER: ${paperTitle || 'Untitled'}\n\n`;
        generatedQuestions.forEach((q, i) => {
            content += `Q${i+1} (${q.marks} marks): ${q.text}\n`;
            if(q.type === QuestionType.MCQ) {
                q.options?.forEach((opt, oi) => content += `   ${String.fromCharCode(65+oi)}. ${opt}\n`);
            }
            content += '\n';
        });
        content += `\n--- ANSWER KEY ---\n`;
        generatedQuestions.forEach((q, i) => {
            content += `Q${i+1}: ${q.correctAnswer}\n`;
        });

        const element = document.createElement("a");
        const file = new Blob([content], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `${paperTitle || 'question_paper'}.txt`;
        document.body.appendChild(element); 
        element.click();
    }
  };

  if (currentView === 'my_papers') {
      return (
          <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">My Papers</h2>
                  <p className="text-slate-500 mt-1">Manage and track your submitted question papers.</p>
                </div>
              </div>

              {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Loading your papers...</p>
                  </div>
              ) : myPapers.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No papers yet</h3>
                    <p className="text-slate-500 mb-8">Start by creating your first AI-powered question paper.</p>
                    <button className="btn-primary">Create New Paper</button>
                  </div>
              ) : (
                  <div className="grid gap-6">
                      {myPapers.map(p => (
                          <motion.div 
                            key={p.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                          >
                              <div className="flex justify-between items-start">
                                  <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                                      <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{p.title}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                          <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                                            <Clock className="w-3 h-3" />
                                            {new Date(p.createdAt).toLocaleDateString()}
                                          </span>
                                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                          <span className="text-xs font-medium text-slate-400">{p.questions.length} Questions</span>
                                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                          <span className="text-xs font-medium text-slate-400">{p.totalMarks} Marks</span>
                                        </div>
                                    </div>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                                      ${p.status === PaperStatus.APPROVED ? 'bg-emerald-50 text-emerald-600' : 
                                        p.status === PaperStatus.REJECTED ? 'bg-red-50 text-red-600' : 
                                        'bg-amber-50 text-amber-600'}`}>
                                      {p.status.replace('_', ' ')}
                                  </span>
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => exportToPDF(p)}
                                        className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all"
                                        title="Download PDF"
                                      >
                                        <FileDown className="w-5 h-5" />
                                      </button>
                                      <button 
                                        onClick={() => exportToDocx(p)}
                                        className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all"
                                        title="Download DOCX"
                                      >
                                        <FileType className="w-5 h-5" />
                                      </button>
                                  </div>
                              </div>
                              {p.adminFeedback && (
                                  <div className="mt-6 flex gap-3 bg-red-50/50 p-4 rounded-2xl border border-red-100/50">
                                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                      <div className="text-sm text-red-700">
                                          <span className="font-bold">Admin Feedback:</span> {p.adminFeedback}
                                      </div>
                                  </div>
                              )}
                          </motion.div>
                      ))}
                  </div>
              )}
          </div>
      )
  }

  if (currentView === 'templates') {
      return (
          <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Paper Templates</h2>
                <p className="text-slate-500 mt-1">Upload and manage your institution's official formats.</p>
              </div>
              
              <div className="bg-white p-12 rounded-3xl text-center border-2 border-dashed border-slate-200 hover:border-brand-500 transition-colors group">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <Layers className="w-8 h-8 text-slate-300 group-hover:text-brand-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Upload College Format</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">Upload a standard PDF header/footer template to be used for your exports.</p>
                  <button className="btn-primary flex items-center gap-2 mx-auto">
                    <Upload className="w-4 h-4" />
                    Select File
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 leading-tight">Create Question Paper</h2>
          <p className="text-slate-500 mt-1">Leverage AI to generate high-quality assessments in seconds.</p>
        </div>
        
        {generatedQuestions.length > 0 && (
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-4 py-2 text-center border-r border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Marks</p>
              <p className="text-xl font-bold text-slate-900">{generatedQuestions.reduce((a, b) => a + Number(b.marks), 0)}</p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Questions</p>
              <p className="text-xl font-bold text-slate-900">{generatedQuestions.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Creation Mode Tabs */}
      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="flex p-2 bg-slate-50/50">
          {[
            { id: 'prompt', label: 'AI Prompt', icon: Sparkles },
            { id: 'upload', label: 'Previous Paper', icon: FileText },
            { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold rounded-2xl transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-brand-500' : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'prompt' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Describe your requirements</label>
                        <textarea 
                            className="input-field min-h-[120px] resize-none"
                            placeholder="e.g. Create 10 MCQs on Data Structures focusing on Graphs, medium difficulty."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end">
                          <button 
                              onClick={handlePromptGenerate}
                              disabled={isLoading || !prompt}
                              className="btn-primary flex items-center gap-2"
                          >
                              {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : <Sparkles className="w-4 h-4" />}
                              {isLoading ? 'Generating...' : 'Generate Questions'}
                          </button>
                      </div>
                  </motion.div>
              )}

              {activeTab === 'upload' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-brand-500 transition-colors group"
                  >
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <FileText className="w-8 h-8 text-slate-300 group-hover:text-brand-500" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">Upload Previous Exam</h3>
                      <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Upload a PDF or DOCX. Our AI will extract and categorize questions automatically.</p>
                      <div className="relative inline-block">
                        <input type="file" accept=".pdf,.docx" onChange={(e) => handleFileUpload(e, 'paper')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                        <button className="btn-secondary flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Choose File
                        </button>
                      </div>
                  </motion.div>
              )}

              {activeTab === 'curriculum' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-brand-500 transition-colors group"
                  >
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-8 h-8 text-slate-300 group-hover:text-brand-500" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">Analyze Curriculum</h3>
                      <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Upload your syllabus to generate a comprehensive topic-wise question bank.</p>
                      <div className="relative inline-block">
                        <input type="file" accept=".pdf,.docx" onChange={(e) => handleFileUpload(e, 'curriculum')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                        <button className="btn-secondary flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Choose File
                        </button>
                      </div>
                  </motion.div>
              )}
            </AnimatePresence>
        </div>
      </div>

      {/* Paper Builder Area */}
      <AnimatePresence>
        {(generatedQuestions.length > 0 || showAddModal) && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex-1 max-w-xl space-y-2">
                      <label className="text-sm font-bold text-slate-700">Paper Title</label>
                      <input 
                        type="text" 
                        value={paperTitle} 
                        onChange={(e) => setPaperTitle(e.target.value)}
                        placeholder="e.g. End Semester Examination - Fall 2024"
                        className="w-full text-2xl font-bold bg-transparent border-b-2 border-slate-200 focus:border-brand-500 outline-none pb-2 transition-colors"
                      />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowAddModal(true)} className="btn-secondary flex items-center gap-2">
                      <PlusCircle className="w-4 h-4" />
                      Add Question
                    </button>
                  </div>
              </div>

              {generatedQuestions.length > 0 && (
                  <div className="grid gap-6">
                     {generatedQuestions.map((q, idx) => (
                         <motion.div 
                           key={q.id} 
                           layout
                           className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all relative group"
                         >
                             <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-2">
                                   <span className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-black">
                                     {idx + 1}
                                   </span>
                                   <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-lg">
                                     {q.type}
                                   </span>
                                   <span className="px-2.5 py-1 bg-brand-50 text-brand-600 text-[10px] font-black uppercase tracking-wider rounded-lg">
                                     {q.marks} Marks
                                   </span>
                                 </div>
                                 <button 
                                   onClick={() => handleRemoveQuestion(q.id)} 
                                   className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                             </div>
                             
                             <p className="text-lg font-medium text-slate-900 mb-6 leading-relaxed">{q.text}</p>
                             
                             {q.options && q.options.length > 0 && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                     {q.options.map((opt, i) => (
                                         <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600">
                                           <span className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">
                                             {String.fromCharCode(65 + i)}
                                           </span>
                                           {opt}
                                         </div>
                                     ))}
                                 </div>
                             )}
                             
                             <div className="flex items-center gap-2 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-xs font-bold text-emerald-700">
                                <CheckCircle2 className="w-4 h-4" />
                                Answer Key: {q.correctAnswer}
                             </div>
                         </motion.div>
                     ))}
                  </div>
              )}

              {generatedQuestions.length > 0 && (
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl shadow-slate-900/20">
                      <div className="flex flex-wrap gap-4">
                          <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold">
                              <FileDown className="w-5 h-5" />
                              PDF
                          </button>
                          <button onClick={() => handleExport('docx')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold">
                              <FileType className="w-5 h-5" />
                              DOCX
                          </button>
                          <button onClick={() => handleExport('txt')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold">
                              <Download className="w-5 h-5" />
                              TXT
                          </button>
                      </div>
                      
                      <div className="flex gap-4 w-full md:w-auto">
                         <button className="flex-1 md:flex-none px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/10">
                           Save Draft
                         </button>
                         <button 
                            onClick={handleSaveForApproval}
                            disabled={isLoading}
                            className="flex-1 md:flex-none px-8 py-3 bg-brand-500 hover:bg-brand-400 text-white rounded-2xl font-bold transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
                         >
                             {isLoading ? (
                               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             ) : <Send className="w-4 h-4" />}
                             {isLoading ? 'Submitting...' : 'Submit for Approval'}
                         </button>
                      </div>
                  </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Question Modal */}
      <AnimatePresence>
        {showAddModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddModal(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white p-8 rounded-[32px] w-full max-w-lg shadow-2xl relative z-10"
                >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl font-bold">Add Custom Question</h3>
                      <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Question Text</label>
                          <textarea 
                             className="input-field min-h-[100px] resize-none" 
                             placeholder="Type your question here..."
                             value={customQuestion.text || ''}
                             onChange={e => setCustomQuestion({...customQuestion, text: e.target.value})}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Type</label>
                              <select 
                                className="input-field"
                                value={customQuestion.type}
                                onChange={e => setCustomQuestion({...customQuestion, type: e.target.value as QuestionType})}
                              >
                                  <option value={QuestionType.SHORT_ANSWER}>Short Answer</option>
                                  <option value={QuestionType.MCQ}>MCQ</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-bold text-slate-700">Marks</label>
                              <input 
                                 type="number" 
                                 className="input-field"
                                 placeholder="5"
                                 value={customQuestion.marks}
                                 onChange={e => setCustomQuestion({...customQuestion, marks: Number(e.target.value)})}
                              />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Correct Answer / Key</label>
                          <input 
                             type="text" 
                             className="input-field"
                             placeholder="Expected answer..."
                             value={customQuestion.correctAnswer || ''}
                             onChange={e => setCustomQuestion({...customQuestion, correctAnswer: e.target.value})}
                          />
                        </div>
                        
                        {customQuestion.type === QuestionType.MCQ && (
                            <div className="flex gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                              <p className="text-[10px] text-slate-500 font-medium">Note: Default options (A, B, C, D) will be added for MCQs. You can edit them later.</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex gap-3 mt-10">
                        <button onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">Cancel</button>
                        <button onClick={handleAddCustomQuestion} className="flex-1 btn-primary">Add Question</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSaved && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100]"
          >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span className="font-bold">Submitted for approval successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacultyDashboard;
