const express = require('express');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');

const router = express.Router();

router.post('/registro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }

    const { data: existe } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();

    if (existe) {
      return res.status(409).json({ erro: 'Email já cadastrado' });
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ nome, email, senha_hash }])
      .select('id, nome, email, criado_em')
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !usuario) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    res.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;