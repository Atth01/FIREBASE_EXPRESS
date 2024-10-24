const express = require('express');
const admin = require('firebase-admin');
const app = express();
const port = 3002;

// Inisialisasi Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://wst-project-5444c-default-rtdb.firebaseio.com'  // Ganti dengan URL Firebase Database kamu
});

const db = admin.database();

app.use(express.json());

// Route GET untuk menampilkan semua user atau berdasarkan parameter query 'nama'
app.get('/users', (req, res) => {
  const { nama } = req.query;

  db.ref('users').once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        if (nama) {
          const filteredUsers = {};
          Object.keys(users).forEach((key) => {
            if (users[key].nama && users[key].nama.toLowerCase() === nama.toLowerCase()) {
              filteredUsers[key] = users[key];
            }
          });

          if (Object.keys(filteredUsers).length === 0) {
            return res.status(404).send({ message: 'No users found with the given name' });
          }
          return res.status(200).json(filteredUsers);
        }
        return res.status(200).json(users);
      } else {
        return res.status(404).send({ message: 'No users found in the database' });
      }
    })
    .catch((error) => {
      console.error('Error fetching users: ', error.message);
      res.status(500).send({ error: 'Error fetching users: ' + error.message });
    });
});

// Route POST untuk menambahkan user baru ke Firebase
app.post('/users', (req, res) => {
  const { nama, username, password } = req.body;

  // Validasi apakah semua data yang diperlukan ada
  if (!nama || !username || !password) {
    return res.status(400).send({ message: 'Nama, username, dan password harus diisi' });
  }

  // Tambahkan data baru ke Firebase dengan method push
  db.ref('users').push({
    nama: nama,
    username: username,
    password: password
  })
    .then(() => {
      res.status(201).send({ message: 'User berhasil ditambahkan!' });
    })
    .catch((error) => {
      console.error('Error adding user: ', error.message);
      res.status(500).send({ error: 'Error adding user: ' + error.message });
    });
});

// Route PUT untuk mengedit user berdasarkan 'nama'
app.put('/users', (req, res) => {
  const { nama, newUsername, newPassword } = req.body;

  // Validasi apakah semua data yang diperlukan ada
  if (!nama || !newUsername || !newPassword) {
    return res.status(400).send({ message: 'Nama, newUsername, dan newPassword harus diisi' });
  }

  // Cari user berdasarkan nama
  db.ref('users').orderByChild('nama').equalTo(nama).once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        // Mendapatkan key (ID) user yang cocok
        const userId = Object.keys(snapshot.val())[0];

        // Update data user berdasarkan key yang ditemukan
        db.ref(`users/${userId}`).update({
          username: newUsername,
          password: newPassword
        })
          .then(() => {
            res.status(200).send({ message: `User dengan nama: ${nama} berhasil diperbarui!` });
          })
          .catch((error) => {
            console.error('Error updating user: ', error.message);
            res.status(500).send({ error: 'Error updating user: ' + error.message });
          });
      } else {
        res.status(404).send({ message: 'User dengan nama tersebut tidak ditemukan' });
      }
    })
    .catch((error) => {
      console.error('Error finding user: ', error.message);
      res.status(500).send({ error: 'Error finding user: ' + error.message });
    });
});

// Route DELETE untuk menghapus user berdasarkan 'nama'
app.delete('/users', (req, res) => {
  const { nama } = req.body;

  // Validasi apakah nama disediakan
  if (!nama) {
    return res.status(400).send({ message: 'Nama harus diisi untuk menghapus user' });
  }

  // Cari user berdasarkan nama
  db.ref('users').orderByChild('nama').equalTo(nama).once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        // Mendapatkan key (ID) user yang cocok
        const userId = Object.keys(snapshot.val())[0];

        // Hapus user berdasarkan key
        db.ref(`users/${userId}`).remove()
          .then(() => {
            res.status(200).send({ message: `User dengan nama: ${nama} berhasil dihapus!` });
          })
          .catch((error) => {
            console.error('Error deleting user: ', error.message);
            res.status(500).send({ error: 'Error deleting user: ' + error.message });
          });
      } else {
        res.status(404).send({ message: 'User dengan nama tersebut tidak ditemukan' });
      }
    })
    .catch((error) => {
      console.error('Error finding user: ', error.message);
      res.status(500).send({ error: 'Error finding user: ' + error.message });
    });
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
