const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { limite = 50 } = req.query;

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, xp_total, nivel, streak_dias')
      .order('xp_total', { ascending: false })
      .limit(parseInt(limite));

    if (error) throw error;

    const ranking = data.map((u, index) => ({
      posicao: index + 1,
      ...u
    }));

    res.json(ranking);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/:usuarioId', async (req, res) => {
  try {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, nome, xp_total, nivel')
      .eq('id', req.params.usuarioId)
      .single();

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    const { count } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .gt('xp_total', usuario.xp_total);

    const posicao = (count || 0) + 1;

    const { data: vizinhos } = await supabase
      .from('usuarios')
      .select('id, nome, xp_total, nivel')
      .order('xp_total', { ascending: false })
      .range(Math.max(0, posicao - 6), posicao + 4);

    res.json({
      posicao,
      usuario,
      vizinhos: vizinhos || []
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
