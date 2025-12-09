// src/pages/HouseholdsPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import api from '../api';

const initialHouseholdForm = {
  household_name: '',
  address: '',
  purok: '',
};

const HouseholdsPage = () => {
  const [households, setHouseholds] = useState([]);
  const [residents, setResidents] = useState([]);
  const [selectedHousehold, setSelectedHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [householdForm, setHouseholdForm] = useState(initialHouseholdForm);
  const [memberForm, setMemberForm] = useState({
    resident_id: '',
    relation_to_head: '',
  });

  const [purokFilter, setPurokFilter] = useState('All');
  const [searchName, setSearchName] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchHouseholds = async () => {
    try {
      const res = await api.get('/households');
      setHouseholds(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching households');
    }
  };

  const fetchResidents = async () => {
    try {
      const res = await api.get('/residents');
      setResidents(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching residents');
    }
  };

  const fetchMembers = async (householdId) => {
    try {
      const res = await api.get(`/households/${householdId}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error(err);
      alert('Error fetching household members');
    }
  };

  useEffect(() => {
    fetchHouseholds();
    fetchResidents();
  }, []);

  const onHouseholdFormChange = (e) => {
    const { name, value } = e.target;
    setHouseholdForm((prev) => ({ ...prev, [name]: value }));
  };

  const onMemberFormChange = (e) => {
    const { name, value } = e.target;
    setMemberForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateHousehold = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/households', householdForm);
      setHouseholdForm(initialHouseholdForm);
      fetchHouseholds();
      setSelectedHousehold(res.data);
      fetchMembers(res.data.id);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error creating household');
    }
  };

  const handleSelectHousehold = (h) => {
    setSelectedHousehold(h);
    fetchMembers(h.id);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedHousehold) {
      alert('Select a household first.');
      return;
    }
    if (!memberForm.resident_id) {
      alert('Select a resident.');
      return;
    }

    try {
      await api.post(`/households/${selectedHousehold.id}/members`, memberForm);
      setMemberForm({ resident_id: '', relation_to_head: '' });
      fetchMembers(selectedHousehold.id);
      fetchHouseholds();
    } catch (err) {
      console.error(err);
      alert('Error adding member');
    }
  };

  // Filters
  const purokOptions = useMemo(() => {
    const set = new Set();
    households.forEach((h) => {
      if (h.purok) set.add(h.purok);
    });
    return Array.from(set).sort();
  }, [households]);

  const filteredHouseholds = households.filter((h) => {
    const matchPurok = purokFilter === 'All' || h.purok === purokFilter;
    const matchName =
      h.household_name.toLowerCase().includes(searchName.toLowerCase()) ||
      h.address.toLowerCase().includes(searchName.toLowerCase());
    return matchPurok && matchName;
  });

  const handleEditClick = (household) => {
    setEditData({ ...household });
    setEditOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSave = async () => {
    try {
      setSavingEdit(true);
      await api.put(`/households/${editData.id}`, editData);
      setEditOpen(false);
      setEditData(null);
      fetchHouseholds();
      if (selectedHousehold && selectedHousehold.id === editData.id) {
        setSelectedHousehold(editData);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error updating household');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditData(null);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Households
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Create Household
            </Typography>
            <Box component="form" onSubmit={handleCreateHousehold} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Household Name"
                    name="household_name"
                    value={householdForm.household_name}
                    onChange={onHouseholdFormChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Address"
                    name="address"
                    value={householdForm.address}
                    onChange={onHouseholdFormChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Purok"
                    name="purok"
                    value={householdForm.purok}
                    onChange={onHouseholdFormChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained">
                    Save Household
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }} elevation={2}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                mb: 2,
              }}
            >
              <Typography variant="h6">Household List</Typography>
              <TextField
                size="small"
                label="Search (household / address)"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              <FormControl size="small">
                <InputLabel>Purok</InputLabel>
                <Select
                  label="Purok"
                  value={purokFilter}
                  onChange={(e) => setPurokFilter(e.target.value)}
                >
                  <MenuItem value="All">All</MenuItem>
                  {purokOptions.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Household Name</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Purok</TableCell>
                    <TableCell>Members</TableCell>
                    <TableCell align="center">Actions</TableCell>
                    <TableCell align="center">Select</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHouseholds.map((h) => (
                    <TableRow
                      key={h.id}
                      hover
                      selected={selectedHousehold?.id === h.id}
                    >
                      <TableCell>{h.id}</TableCell>
                      <TableCell>{h.household_name}</TableCell>
                      <TableCell>{h.address}</TableCell>
                      <TableCell>{h.purok || ''}</TableCell>
                      <TableCell>{h.member_count}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleEditClick(h)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleSelectHousehold(h)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          {selectedHousehold ? (
            <Paper sx={{ p: 2 }} elevation={2}>
              <Typography variant="h6" gutterBottom>
                Members of: {selectedHousehold.household_name} (ID:{' '}
                {selectedHousehold.id})
              </Typography>

              <Box
                component="form"
                onSubmit={handleAddMember}
                noValidate
                sx={{ mb: 2 }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Resident</InputLabel>
                      <Select
                        label="Resident"
                        name="resident_id"
                        value={memberForm.resident_id}
                        onChange={onMemberFormChange}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {residents.map((r) => (
                          <MenuItem key={r.id} value={r.id}>
                            {r.last_name}, {r.first_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Relation to Head"
                      name="relation_to_head"
                      value={memberForm.relation_to_head}
                      onChange={onMemberFormChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button type="submit" variant="contained">
                      Add Member
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Resident</TableCell>
                      <TableCell>Relation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{m.id}</TableCell>
                        <TableCell>
                          {m.last_name}, {m.first_name}
                        </TableCell>
                        <TableCell>{m.relation_to_head || ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : (
            <Typography variant="body1">
              Select a household from the left to view and manage members.
            </Typography>
          )}
        </Grid>
      </Grid>

      {/* Edit Household Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose}>
        <DialogTitle>Edit Household</DialogTitle>
        <DialogContent dividers>
          {editData && (
            <Box sx={{ mt: 1 }}>
              <TextField
                sx={{ mb: 2 }}
                label="Household Name"
                name="household_name"
                value={editData.household_name}
                onChange={handleEditChange}
                fullWidth
              />
              <TextField
                sx={{ mb: 2 }}
                label="Address"
                name="address"
                value={editData.address}
                onChange={handleEditChange}
                fullWidth
              />
              <TextField
                label="Purok"
                name="purok"
                value={editData.purok || ''}
                onChange={handleEditChange}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={savingEdit}
          >
            {savingEdit ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HouseholdsPage;
