const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { disciplina_id } = req.query;

    let query = supabase
      .from('modulos')
      .select('*, disciplinas(nome, icone, cor)')
      .eq('activo', true)
      .order('ordem');

    if (disciplina_id) {
      query = query.eq('disciplina_id', disciplina_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('modulos')
      .select('*, disciplinas(nome, icone, cor)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ erro: 'Módulo não encontrado' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { disciplina_id, nome, descricao, icone, ordem, xp_necessario } = req.body;

    if (!disciplina_id || !nome) {
      return res.status(400).json({ erro: 'Disciplina ID e nome são obrigatórios' });
    }

    const { data, error } = await supabase
      .from('modulos')
      .insert([{ disciplina_id, nome, descricao, icone, ordem, xp_necessario }])
      .select('*, disciplinas(nome, icone, cor)')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { disciplina_id, nome, descricao, icone, ordem, activo, xp_necessario } = req.body;

    const { data, error } = await supabase
      .from('modulos')
      .update({ disciplina_id, nome, descricao, icone, ordem, activo, xp_necessario })
      .eq('id', req.params.id)
      .select('*, disciplinas(nome, icone, cor)')
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ erro: 'Módulo não encontrado' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('modulos')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ mensagem: 'Módulo eliminado com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
