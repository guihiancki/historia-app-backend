const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('disciplinas')
      .select('*')
      .eq('activa', true)
      .order('ordem');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('disciplinas')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ erro: 'Disciplina não encontrada' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, descricao, icone, cor, ordem } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'Nome é obrigatório' });
    }

    const { data, error } = await supabase
      .from('disciplinas')
      .insert([{ nome, descricao, icone, cor, ordem }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nome, descricao, icone, cor, ordem, activa } = req.body;

    const { data, error } = await supabase
      .from('disciplinas')
      .update({ nome, descricao, icone, cor, ordem, activa })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ erro: 'Disciplina não encontrada' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('disciplinas')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ mensagem: 'Disciplina eliminada com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
