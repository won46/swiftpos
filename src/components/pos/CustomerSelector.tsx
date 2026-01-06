'use client';

import { useState, useEffect } from 'react';
import { Search, User, X, Check } from 'lucide-react';
import { customersAPI } from '@/services/api';
import { Customer } from '@/types';
import { Modal, Button } from '@/components/ui';

interface CustomerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  selectedCustomerId?: string | null;
}

export function CustomerSelector({ isOpen, onClose, onSelect, selectedCustomerId }: CustomerSelectorProps) {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen, query]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await customersAPI.getAll({ search: query, limit: 10 });
      setCustomers(res.data.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pilih Pelanggan">
      <div className="p-4">
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari nama, kode, atau no HP..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        </div>

        {/* Customer List */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Tidak ada pelanggan ditemukan</div>
          ) : (
            customers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => {
                  onSelect(customer);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedCustomerId === customer.id
                    ? 'bg-indigo-50 border border-indigo-200'
                    : 'hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                     selectedCustomerId === customer.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{customer.name}</h3>
                    <p className="text-sm text-gray-500">{customer.phone || customer.email || '-'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    customer.currentDebt > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {customer.currentDebt > 0 ? `Hutang: ${formatCurrency(customer.currentDebt)}` : 'Lunas'}
                  </div>
                  {selectedCustomerId === customer.id && (
                    <div className="mt-1 flex justify-end text-indigo-600">
                      <Check size={16} />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t flex justify-end">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </div>
    </Modal>
  );
}
