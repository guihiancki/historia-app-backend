const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { modulo_id, dificuldade } = req.query;

    let query = supabase
      .from('perguntas')
      .select('*, modulos(id, nome, disciplina_id)')
      .eq('activa', true)
      .order('criado_em', { ascending: false });

    if (modulo_id) {
      query = query.eq('modulo_id', modulo_id);
    }

    if (dificuldade) {
      query = query.eq('dificuldade', dificuldade);
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
      .from('perguntas')
      .select('*, modulos(id, nome, disciplina_id)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ erro: 'Pergunta não encontrada' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { modulo_id, enunciado, tipo, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta_correta, explicacao, dificuldade, fonte } = req.body;

    if (!modulo_id || !enunciado || !opcao_a || !opcao_b || !resposta_correta) {
      return res.status(400).json({ erro: 'Módulo ID, enunciado, opções A e B, e resposta correta são obrigatórios' });
    }

    if (!['a', 'b', 'c', 'd', 'e'].includes(resposta_correta)) {
      return res.status(400).json({ erro: 'Resposta correta deve ser a, b, c, d ou e' });
    }

    const { data, error } = await supabase
      .from('perguntas')
      .insert([{
        modulo_id, enunciado, tipo, opcao_a, opcao_b,
        opcao_c, opcao_d, opcao_e, resposta_correta,
        explicacao, dificuldade, fonte
      }])
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
    const { modulo_id, enunciado, tipo, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta_correta, explicacao, dificuldade, fonte, activa } = req.body;

    const { data, error } = await supabase
      .from('perguntas')
      .update({
        modulo_id, enunciado, tipo, opcao_a, opcao_b,
        opcao_c, opcao_d, opcao_e, resposta_correta,
        explicacao, dificuldade, fonte, activa
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ erro: 'Pergunta não encontrada' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('perguntas')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ mensagem: 'Pergunta eliminada com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
