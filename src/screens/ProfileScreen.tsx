import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Linking, TextInput, Switch, ActivityIndicator, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const isFarmer = user?.role === 'farmer';
  const accentColor = isFarmer ? '#f57c00' : '#2e7d32';

  const [orderCount, setOrderCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  // Edit Name Modal
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  // Change Password Modal
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // Notification toggle (local state only)
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifPromos, setNotifPromos] = useState(false);

  // Load live stats
  useEffect(() => {
    if (!user?.id) return;
    if (isFarmer) {
      // Farmer stats: count products + sum revenue from delivered orders
      const prodQ = query(collection(db, 'products'), where('farmerId', '==', user.id));
      const unsub1 = onSnapshot(prodQ, snap => setProductCount(snap.docs.length));
      const orderQ = query(collection(db, 'orders'));
      const unsub2 = onSnapshot(orderQ, snap => {
        const delivered = snap.docs.map(d => d.data() as any).filter(o =>
          o.status === 'Delivered' && o.items?.some((i: any) => i.farmerId === user.id)
        );
        const rev = delivered.reduce((sum, o) => {
          const myItems = (o.items || []).filter((i: any) => i.farmerId === user.id);
          return sum + myItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
        }, 0);
        setTotalRevenue(rev);
        setOrderCount(delivered.length);
        setLoadingStats(false);
      });
      return () => { unsub1(); unsub2(); };
    } else {
      // Buyer stats: count orders and sum spending
      const q = query(collection(db, 'orders'), where('buyerId', '==', user.id));
      const unsub = onSnapshot(q, snap => {
        const orders = snap.docs.map(d => d.data() as any);
        setOrderCount(orders.length);
        setTotalSpent(orders.reduce((sum, o) => sum + (o.total || 0), 0));
        setLoadingStats(false);
      });
      return unsub;
    }
  }, [user?.id]);

  const handleSaveName = async () => {
    if (!newName.trim()) { Alert.alert('Error', 'Name cannot be empty.'); return; }
    setSavingName(true);
    try {
      await updateDoc(doc(db, 'users', user.id), { name: newName.trim() });
      Alert.alert('✅ Saved', 'Your display name has been updated!');
      setNameModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { Alert.alert('Error', 'All fields are required.'); return; }
    if (newPw !== confirmPw) { Alert.alert('Error', 'New passwords do not match.'); return; }
    if (newPw.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters.'); return; }
    setSavingPw(true);
    try {
      const currentUser = auth.currentUser!;
      const credential = EmailAuthProvider.credential(currentUser.email!, currentPw);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPw);
      Alert.alert('✅ Success', 'Password changed successfully!');
      setPwModalVisible(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e: any) {
      Alert.alert('Error', e.message.includes('wrong-password') ? 'Current password is incorrect.' : e.message);
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', onPress: logout, style: 'destructive' }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: accentColor }]}>
        <View style={[styles.avatar, { backgroundColor: accentColor }]}>
          <Text style={styles.avatarText}>
            {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Farmlink SL User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: accentColor + '20' }]}>
          <Ionicons name={isFarmer ? 'leaf' : 'basket'} size={14} color={accentColor} style={{ marginRight: 5 }} />
          <Text style={[styles.roleText, { color: accentColor }]}>
            {isFarmer ? 'Farmer' : 'Buyer'}
          </Text>
        </View>
      </View>

      {/* Live Stats */}
      <View style={styles.statsRow}>
        {loadingStats ? (
          <ActivityIndicator color={accentColor} />
        ) : isFarmer ? (
          <>
            <View style={styles.statBox}>
              <Ionicons name="cube-outline" size={24} color={accentColor} />
              <Text style={styles.statValue}>{productCount}</Text>
              <Text style={styles.statLabel}>Products Listed</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxMiddle]}>
              <Ionicons name="checkmark-done-outline" size={24} color={accentColor} />
              <Text style={styles.statValue}>{orderCount}</Text>
              <Text style={styles.statLabel}>Fulfilled Orders</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="cash-outline" size={24} color={accentColor} />
              <Text style={styles.statValue}>Le {totalRevenue.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.statBox}>
              <Ionicons name="receipt-outline" size={24} color={accentColor} />
              <Text style={styles.statValue}>{orderCount}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="wallet-outline" size={24} color={accentColor} />
              <Text style={styles.statValue}>Le {totalSpent.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </>
        )}
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => setNameModalVisible(true)}>
          <View style={[styles.menuIcon, { backgroundColor: accentColor + '15' }]}>
            <Ionicons name="person-outline" size={20} color={accentColor} />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>Display Name</Text>
            <Text style={styles.menuSubText}>{user?.name || 'Not set'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => setPwModalVisible(true)}>
          <View style={[styles.menuIcon, { backgroundColor: '#1976D220' }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#1976D2" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>Change Password</Text>
            <Text style={styles.menuSubText}>Update your account password</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#9C27B020' }]}>
            <Ionicons name="notifications-outline" size={20} color="#9C27B0" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>Order Updates</Text>
            <Text style={styles.menuSubText}>Get notified when your order status changes</Text>
          </View>
          <Switch
            value={notifOrders}
            onValueChange={setNotifOrders}
            trackColor={{ false: '#e0e0e0', true: accentColor + '80' }}
            thumbColor={notifOrders ? accentColor : '#f4f3f4'}
          />
        </View>
        <View style={styles.menuItem}>
          <View style={[styles.menuIcon, { backgroundColor: '#FF980020' }]}>
            <Ionicons name="pricetag-outline" size={20} color="#FF9800" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>Promotions & Deals</Text>
            <Text style={styles.menuSubText}>Receive special offers from Farmlink SL</Text>
          </View>
          <Switch
            value={notifPromos}
            onValueChange={setNotifPromos}
            trackColor={{ false: '#e0e0e0', true: accentColor + '80' }}
            thumbColor={notifPromos ? accentColor : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('mailto:support@farmlink.sl')}>
          <View style={[styles.menuIcon, { backgroundColor: '#0097A720' }]}>
            <Ionicons name="mail-outline" size={20} color="#0097A7" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>Email Support</Text>
            <Text style={styles.menuSubText}>support@farmlink.sl</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('tel:+23276000000')}>
          <View style={[styles.menuIcon, { backgroundColor: '#4CAF5020' }]}>
            <Ionicons name="call-outline" size={20} color="#4CAF50" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>Call Support</Text>
            <Text style={styles.menuSubText}>+232 76 000 000</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Farmlink SL', 'Version 1.0.0\nBuilt in Sierra Leone 🇸🇱\n\n© 2025 Farmlink SL. All rights reserved.')}>
          <View style={[styles.menuIcon, { backgroundColor: '#78909C20' }]}>
            <Ionicons name="information-circle-outline" size={20} color="#78909C" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>About Farmlink SL</Text>
            <Text style={styles.menuSubText}>Version 1.0.0</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#e53935" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* Edit Name Modal */}
      <Modal visible={nameModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Display Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your name"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setNameModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: accentColor }]} onPress={handleSaveName} disabled={savingName}>
                {savingName ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={pwModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput style={styles.modalInput} value={currentPw} onChangeText={setCurrentPw} placeholder="Current password" secureTextEntry />
            <TextInput style={styles.modalInput} value={newPw} onChangeText={setNewPw} placeholder="New password (min 6 chars)" secureTextEntry />
            <TextInput style={styles.modalInput} value={confirmPw} onChangeText={setConfirmPw} placeholder="Confirm new password" secureTextEntry />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setPwModalVisible(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: '#1976D2' }]} onPress={handleChangePassword} disabled={savingPw}>
                {savingPw ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSaveText}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', width: '100%', maxWidth: 800, alignSelf: 'center' },
  header: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20, backgroundColor: '#fff', marginBottom: 16, borderBottomWidth: 3 },
  avatar: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 14, elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  avatarText: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
  email: { fontSize: 14, color: '#888', marginBottom: 14 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14 },
  roleText: { fontWeight: 'bold', fontSize: 13 },
  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginBottom: 16, padding: 16, justifyContent: 'space-around' },
  statBox: { alignItems: 'center', flex: 1 },
  statBoxMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f0f0f0' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginTop: 6, marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#888', textAlign: 'center' },
  section: { backgroundColor: '#fff', marginBottom: 16, borderRadius: 0 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#aaa', marginLeft: 20, paddingTop: 16, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#f5f5f5' },
  menuIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuContent: { flex: 1 },
  menuText: { fontSize: 15, color: '#1a1a1a', fontWeight: '500' },
  menuSubText: { fontSize: 12, color: '#aaa', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 16, marginHorizontal: 20, marginBottom: 40, borderRadius: 14, elevation: 1, shadowColor: '#e53935', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#e53935', marginLeft: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 20 },
  modalInput: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: '#e0e0e0' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  modalCancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, backgroundColor: '#f0f0f0' },
  modalCancelText: { fontWeight: 'bold', color: '#666', fontSize: 15 },
  modalSaveBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  modalSaveText: { fontWeight: 'bold', color: '#fff', fontSize: 15 },
});
