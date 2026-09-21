const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { modulo_id } = req.query;

    let query = supabase
      .from('aulas')
      .select('*, modulos(id, nome, disciplina_id)')
      .eq('activa', true)
      .order('ordem');

    if (modulo_id) {
      query = query.eq('modulo_id', modulo_id);
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
      .from('aulas')
      .select('*, modulos(id, nome, disciplina_id)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ erro: 'Aula não encontrada' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { modulo_id, titulo, conteudo, resumo, ordem, xp_recompensa } = req.body;

    if (!modulo_id || !titulo || !conteudo) {
      return res.status(400).json({ erro: 'Módulo ID, título e conteúdo são obrigatórios' });
    }

    const { data, error } = await supabase
      .from('aulas')
      .insert([{ modulo_id, titulo, conteudo, resumo, ordem, xp_recompensa }])
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
    const { modulo_id, titulo, conteudo, resumo, ordem, xp_recompensa, activa } = req.body;

    const { data, error } = await supabase
      .from('aulas')
      .update({ modulo_id, titulo, conteudo, resumo, ordem, xp_recompensa, activa })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ erro: 'Aula não encontrada' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('aulas')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ mensagem: 'Aula eliminada com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
