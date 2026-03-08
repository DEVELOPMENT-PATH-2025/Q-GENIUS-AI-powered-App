import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Book, 
  ChevronRight, 
  MessageSquare,
  ArrowLeft,
  FileText,
  AlertCircle,
  FileDown,
  FileType
} from 'lucide-react';
import { getPapersForAdmin, updatePaperStatus } from '../services/mockServices';
import { exportToPDF, exportToDocx } from '../services/exportService';
import { QuestionPaper, PaperStatus } from '../types';

const AdminDashboard: React.FC = () => {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<QuestionPaper | null>(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    const data = await getPapersForAdmin();
    setPapers(data);
    setLoading(false);
  };

  const handleDecision = async (status: PaperStatus) => {
    if (!selectedPaper) return;
    await updatePaperStatus(selectedPaper.id, status, feedback);
    setSelectedPaper(null);
    setFeedback('');
    loadQueue();
  };

  if (selectedPaper) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        <button 
          onClick={() => setSelectedPaper(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Queue
        </button>

        <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-100">
                  Pending Review
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-sm font-bold text-slate-500">{selectedPaper.courseCode}</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">{selectedPaper.title}</h2>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <User className="w-4 h-4" />
                  {selectedPaper.facultyName}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  {new Date(selectedPaper.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
              <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100">
                <div className="flex gap-2 px-4 border-r border-slate-100">
                    <button 
                      onClick={() => exportToPDF(selectedPaper)}
                      className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all"
                      title="Download PDF"
                    >
                      <FileDown className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => exportToDocx(selectedPaper)}
                      className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all"
                      title="Download DOCX"
                    >
                      <FileType className="w-5 h-5" />
                    </button>
                </div>
                <div className="text-center px-4 border-r border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Marks</p>
                  <p className="text-xl font-bold text-slate-900">{selectedPaper.totalMarks}</p>
                </div>
                <div className="text-center px-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Questions</p>
                  <p className="text-xl font-bold text-slate-900">{selectedPaper.questions.length}</p>
                </div>
              </div>
          </div>

          <div className="p-8 space-y-8">
            {selectedPaper.questions.map((q, i) => (
              <div key={q.id} className="relative pl-12">
                 <div className="absolute left-0 top-0 w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-slate-500">
                   {i + 1}
                 </div>
                 <div className="flex items-center gap-3 mb-3">
                   <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-md">
                     {q.type}
                   </span>
                   <span className="text-xs font-bold text-slate-400">{q.marks} Marks</span>
                 </div>
                 <p className="text-lg font-medium text-slate-900 leading-relaxed mb-4">{q.text}</p>
                 
                 {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-500">
                              <span className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">
                                {String.fromCharCode(65+idx)}
                              </span>
                              {opt}
                            </div>
                        ))}
                    </div>
                 )}
              </div>
            ))}
          </div>

          <div className="p-8 bg-slate-900 text-white">
             <div className="flex items-center gap-2 mb-4">
               <MessageSquare className="w-5 h-5 text-brand-400" />
               <label className="text-sm font-bold">Reviewer Feedback</label>
             </div>
             <textarea 
               className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all mb-8 min-h-[100px] resize-none"
               placeholder="Add comments for the faculty member (optional for approval, required for rejection)..."
               value={feedback}
               onChange={(e) => setFeedback(e.target.value)}
             />
             <div className="flex flex-col md:flex-row justify-end gap-4">
               <button 
                  onClick={() => handleDecision(PaperStatus.REJECTED)}
                  className="px-8 py-3 bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-white rounded-2xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
               >
                  <XCircle className="w-5 h-5" />
                  Reject Paper
               </button>
               <button 
                  onClick={() => handleDecision(PaperStatus.APPROVED)}
                  className="px-8 py-3 bg-brand-500 hover:bg-brand-400 text-white rounded-2xl font-bold transition-all shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
               >
                  <CheckCircle2 className="w-5 h-5" />
                  Approve & Finalize
               </button>
             </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Review Queue</h2>
          <p className="text-slate-500 mt-1">Evaluate and approve submitted question papers.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading queue...</p>
        </div>
      ) : papers.length === 0 ? (
        <div className="bg-white rounded-[32px] p-16 text-center border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">All caught up!</h3>
            <p className="text-slate-500">There are no pending papers to review at this time.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {papers.map(paper => (
            <motion.div 
              key={paper.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-md transition-all group"
            >
              <div className="flex gap-4">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-900 group-hover:text-brand-600 transition-colors">{paper.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-sm font-bold text-slate-400">{paper.courseCode}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="flex items-center gap-1.5 text-sm text-slate-500">
                      <User className="w-3.5 h-3.5" />
                      {paper.facultyName}
                    </span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span className="text-sm text-slate-500">{paper.questions.length} Questions</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-amber-100">
                      Pending Approval
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPaper(paper)}
                className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
              >
                Review Paper
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
