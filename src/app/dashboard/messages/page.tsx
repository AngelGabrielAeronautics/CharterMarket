'use client';

import React, { useState } from 'react';
import { Box, Typography, Container, Paper, Button, Alert } from '@mui/material';
import { BugReport, Security, Chat } from '@mui/icons-material';
import MessagingInterface from '@/components/messaging/MessagingInterface';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

export default function MessagesPage() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const runAuthenticationTest = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      if (!auth.currentUser) {
        setTestResults('❌ No authenticated user found');
        return;
      }

      const idToken = await auth.currentUser.getIdToken();
      
      // Test user claims
      const claimsResponse = await fetch('/api/debug/user-claims', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      
      const claimsData = await claimsResponse.json();
      
      let results = '🔍 **Authentication Test Results:**\n\n';
      results += `✅ User: ${user?.userCode || 'Unknown'}\n`;
      results += `✅ Role: ${user?.role || 'Unknown'}\n`;
      results += `✅ Email: ${auth.currentUser.email}\n\n`;
      
      if (claimsData.customClaims?.userCode && claimsData.customClaims?.role) {
        results += '✅ **Custom Claims**: Present\n';
        results += `   - userCode: ${claimsData.customClaims.userCode}\n`;
        results += `   - role: ${claimsData.customClaims.role}\n\n`;
      } else {
        results += '❌ **Custom Claims**: Missing\n';
        results += '🔧 **Attempting to fix claims...**\n\n';
        
        // Try to fix claims
        const fixResponse = await fetch('/api/auth/fix-user-claims', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });
        
        if (fixResponse.ok) {
          results += '✅ **Claims Fixed Successfully**\n';
          await auth.currentUser.getIdToken(true); // Refresh token
        } else {
          results += '❌ **Claims Fix Failed**\n';
        }
      }
      
      // Test conversation creation
      results += '🧪 **Testing Conversation Creation...**\n';
      const testConversationResponse = await fetch('/api/debug/test-conversation', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${await auth.currentUser.getIdToken(true)}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (testConversationResponse.ok) {
        const testData = await testConversationResponse.json();
        results += '✅ **Test Conversation Created**\n';
        results += `   - ID: ${testData.conversationId}\n`;
        results += `   - Message ID: ${testData.messageId}\n\n`;
        results += '🎉 **Messaging System Working!**\n';
        results += 'Refresh the page to see your test conversation.';
      } else {
        const errorData = await testConversationResponse.json();
        results += '❌ **Test Conversation Failed**\n';
        results += `   - Error: ${errorData.error}\n`;
        results += `   - Details: ${errorData.details || 'Unknown'}\n`;
      }
      
      setTestResults(results);
      
    } catch (error: any) {
      setTestResults(`❌ **Test Failed**: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Messages
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Communicate with operators, passengers, and agents
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<BugReport />}
            onClick={runAuthenticationTest}
            disabled={testing}
            color="secondary"
          >
            {testing ? 'Testing...' : 'Test System'}
          </Button>
        </Box>
      </Box>

      {testResults && (
        <Alert 
          severity={testResults.includes('❌') ? 'error' : 'success'} 
          sx={{ mb: 2, whiteSpace: 'pre-line', fontFamily: 'monospace' }}
          onClose={() => setTestResults(null)}
        >
          {testResults}
        </Alert>
      )}

      <Paper sx={{ flex: 1, overflow: 'hidden' }}>
        <MessagingInterface />
      </Paper>
    </Container>
  );
} 