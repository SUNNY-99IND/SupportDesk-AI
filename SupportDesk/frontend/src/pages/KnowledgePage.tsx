import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchKnowledgeDocs,
  createKnowledgeDoc,
  updateKnowledgeDoc,
  deleteKnowledgeDoc,
  type KnowledgeDocument,
} from '../services/knowledge.service';
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Modal } from '../components/Modal';

export function KnowledgePage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('FAQ');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwnerOrAdmin = user?.roles.includes('OWNER') || user?.roles.includes('ADMIN');

  const categories = [
    'Shipping Policy',
    'Return Policy',
    'Refund Policy',
    'Cancellation Policy',
    'Technical',
    'Account',
    'FAQ',
  ];

  const loadDocs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchKnowledgeDocs();
      setDocs(data);
    } catch (err: any) {
      console.error('Failed to load knowledge articles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const openCreateModal = () => {
    setEditingDocId(null);
    setFormTitle('');
    setFormCategory('Return Policy');
    setFormContent('');
    setFormTags('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (doc: KnowledgeDocument) => {
    setEditingDocId(doc._id);
    setFormTitle(doc.title);
    setFormCategory(doc.category);
    setFormContent(doc.content);
    setFormTags(doc.tags.join(', '));
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setError('Please provide both title and content.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const tagsArray = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingDocId) {
        const updated = await updateKnowledgeDoc(editingDocId, {
          title: formTitle.trim(),
          category: formCategory,
          content: formContent.trim(),
          tags: tagsArray,
        });
        setDocs((prev) => prev.map((d) => (d._id === editingDocId ? updated : d)));
        setNotice('Knowledge article updated.');
      } else {
        const created = await createKnowledgeDoc({
          title: formTitle.trim(),
          category: formCategory,
          content: formContent.trim(),
          tags: tagsArray,
        });
        setDocs((prev) => [created, ...prev]);
        setNotice('Knowledge article published to AI RAG index.');
      }

      setIsModalOpen(false);
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to save knowledge document.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? AI will no longer use it for answers.`)) {
      return;
    }

    try {
      await deleteKnowledgeDoc(id);
      setDocs((prev) => prev.filter((d) => d._id !== id));
      setNotice('Knowledge article removed.');
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete knowledge document');
    }
  };

  // Client-side search & category filtering
  const filteredDocs = docs.filter((d) => {
    const matchesCat = selectedCategory === 'ALL' || d.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      d.title.toLowerCase().includes(q) ||
      d.content.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace Knowledge Base & AI RAG
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Isolated business documentation and policies used by SupportDesk AI to answer customer inquiries.
          </p>
        </div>

        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 transition"
          >
            <Plus className="size-4" />
            <span>Add Knowledge Article</span>
          </button>
        )}
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* RAG Information Callout */}
      <div className="rounded-2xl border border-brand-200/80 bg-gradient-to-r from-brand-50/70 to-indigo-50/70 p-5 dark:border-brand-900/40 dark:from-brand-950/30 dark:to-indigo-950/30">
        <div className="flex items-start gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shrink-0 mt-0.5 shadow-xs">
            <Sparkles className="size-4" />
          </div>
          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-900 dark:text-white">
              Business-Specific Retrieval Augmented Generation (RAG)
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              When a visitor asks a question on your website (e.g. <em>"What is your return policy?"</em>), SupportDesk AI retrieves relevant passages strictly from your workspace's articles below. Knowledge is 100% isolated and never shared between businesses.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies, shipping, refunds, keywords..."
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            All Categories ({docs.length})
          </button>
          {categories.map((cat) => {
            const count = docs.filter((d) => d.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Grid */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-xs text-slate-400 gap-2">
          <Loader2 className="size-4 animate-spin text-brand-600" />
          <span>Loading knowledge base...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
          <BookOpen className="mx-auto size-10 text-slate-300 dark:text-slate-600" />
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">No knowledge articles found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'No articles matched your search term.'
              : 'Add your business policies (Shipping, Refunds, FAQs) so your AI assistant can accurately guide customers.'}
          </p>
          {isOwnerOrAdmin && !searchQuery && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              <Plus className="size-3.5" />
              <span>Create First Article</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc._id}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-4 hover:border-brand-300 dark:hover:border-brand-700 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                    {doc.category}
                  </span>

                  {isOwnerOrAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(doc)}
                        className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        title="Edit Article"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc._id, doc.title)}
                        className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="Delete Article"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{doc.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {doc.content}
                </p>
              </div>

              {/* Tags & Updated date */}
              <div className="border-t border-slate-100 pt-3 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex flex-wrap gap-1 items-center">
                  <Tag className="size-3 text-slate-400 shrink-0" />
                  {doc.tags && doc.tags.length > 0 ? (
                    doc.tags.map((t) => (
                      <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-800">
                        {t}
                      </span>
                    ))
                  ) : (
                    <span>General</span>
                  )}
                </div>
                <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Article Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDocId ? 'Edit Knowledge Article' : 'New Knowledge Article'}
      >
        <form onSubmit={handleSaveDoc} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Article Title
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. 30-Day Money-Back Guarantee & Return Window"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Policy Category
            </label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Content & Policy Details
            </label>
            <textarea
              required
              rows={6}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Write the exact business policy or guidance. The AI will cite and synthesize this text when answering customer questions."
              className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Keywords & Tags (comma separated)
            </label>
            <input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="refund, return, tracking, money, carrier"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingDocId ? 'Update Article' : 'Publish Article'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
