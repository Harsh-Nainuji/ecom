"use client";

import React, { useState } from 'react';
import { Plus, Trash2, Tag, Image as ImageIcon } from 'lucide-react';
import { createCategory, deleteCategory } from '../../lib/actions';

export default function CategoriesClient({ categories }: { categories: any[] }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createCategory(formData);
      setShowAddModal(false);
      window.location.reload();
    } catch (err: any) {
      alert("Failed to add category: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await deleteCategory(id);
      window.location.reload();
    } catch (err: any) {
      alert("Failed to delete category: " + err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#c2185b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#a0134a] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add New Category
        </button>
      </div>

      <div className="rounded-2xl border border-[#F7E4E6] bg-white p-6 premium-shadow">
        {categories.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-400">No categories created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#F7E4E6] text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3.5 pl-2">Order</th>
                  <th className="pb-3.5">Category Name</th>
                  <th className="pb-3.5">URL Slug</th>
                  <th className="pb-3.5">Created Date</th>
                  <th className="pb-3.5 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7E4E6]/60">
                {categories.map((cat: any) => (
                  <tr key={cat.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 pl-2 font-mono font-bold text-slate-500">
                      #{cat.displayOrder}
                    </td>
                    <td className="py-4 font-bold text-[#1A1A2D] flex items-center gap-2">
                      {cat.iconUrl ? (
                        <img src={cat.iconUrl} alt={cat.name} className="w-7 h-7 rounded-lg object-cover border border-slate-200" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center text-[#c2185b]">
                          <Tag className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <span>{cat.name}</span>
                    </td>
                    <td className="py-4 font-mono text-slate-500 text-[11px]">{cat.slug}</td>
                    <td className="py-4 text-slate-500">
                      {new Date(cat.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 text-right pr-2">
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase text-rose-700 hover:bg-rose-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#c2185b]" />
                <h3 className="text-base font-bold text-slate-900">Add New Category</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name (e.g. Sarees & Ethnic Wear)
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Enter category title"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#c2185b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Display Order Number
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  defaultValue={categories.length + 1}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#c2185b]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Icon / Thumbnail Image (Optional)
                </label>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#c2185b] px-5 py-2 text-xs font-bold text-white hover:bg-[#a0134a] shadow-md"
                >
                  {saving ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
