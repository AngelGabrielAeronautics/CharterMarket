'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  createClient,
  getAgentClients,
  getAllClients,
  getClientById,
  updateClient as updateClientApi,
  deleteClient as deleteClientApi,
} from '@/lib/client';
import { ClientFormData, Client } from '@/types/client';
import toast from 'react-hot-toast';

/**
 * Hook to fetch clients for an agent
 */
export function useAgentClients(agentUserCode?: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    if (!agentUserCode) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getAgentClients(agentUserCode);
      setClients(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [agentUserCode]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return { clients, loading, error, refreshClients: fetchClients };
}

/**
 * Hook to fetch all clients (admin only)
 */
export function useAllClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllClients();
      setClients(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return { clients, loading, error, refreshClients: fetchClients };
}

/**
 * Hook to fetch a single client by ID
 */
export function useClientDetail(clientId?: string) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    const fetchClient = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getClientById(clientId);
        setClient(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load client details');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  return { client, loading, error };
}

/**
 * Hook to create a new client
 */
export function useClientCreation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  const createNewClient = async (agentUserCode: string, data: ClientFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setClientId(null);

    try {
      const id = await createClient(agentUserCode, data);
      setClientId(id);
      setSuccess(true);
      toast.success('Client created successfully');
      return id;
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create client';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createNewClient, loading, error, success, clientId };
}

/**
 * Hook to update a client
 */
export function useClientUpdate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateClient = async (clientId: string, data: Partial<ClientFormData>) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateClientApi(clientId, data);
      setSuccess(true);
      toast.success('Client updated successfully');
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { updateClient, loading, error, success };
}

/**
 * Hook to delete a client
 */
export function useClientDeletion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const deleteClient = async (clientId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await deleteClientApi(clientId);
      setSuccess(true);
      toast.success('Client deleted successfully');
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete client';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { deleteClient, loading, error, success };
}
