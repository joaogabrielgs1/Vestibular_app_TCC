package com.tcc.vestibular.ui.history

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.tcc.vestibular.data.api.ApiClient
import com.tcc.vestibular.databinding.FragmentHistoryBinding
import kotlinx.coroutines.launch

class HistoryFragment : Fragment() {

    private var _binding: FragmentHistoryBinding? = null
    private val binding get() = _binding!!

    private lateinit var historyAdapter: HistoryAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHistoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        loadHistory()

        binding.swipeRefreshHistory.setOnRefreshListener {
            loadHistory()
        }
    }

    private fun setupRecyclerView() {
        historyAdapter = HistoryAdapter()
        binding.rvHistory.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = historyAdapter
        }
    }

    private fun loadHistory() {
        binding.swipeRefreshHistory.isRefreshing = true

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(requireContext())
                val response = apiService.getHistory(page = 1, limit = 50)

                if (response.isSuccessful && response.body() != null) {
                    val items = response.body()!!.data
                    historyAdapter.setHistory(items)
                    binding.tvEmptyHistory.visibility =
                        if (items.isEmpty()) View.VISIBLE else View.GONE
                } else {
                    Toast.makeText(
                        requireContext(),
                        "Não foi possível carregar seu histórico. Tente novamente mais tarde.",
                        Toast.LENGTH_LONG
                    ).show()
                }
            } catch (e: Exception) {
                android.util.Log.e("HistoryFragment", "Erro ao carregar histórico", e)
                Toast.makeText(
                    requireContext(),
                    "Não foi possível carregar seu histórico. Verifique sua conexão e tente novamente.",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                binding.swipeRefreshHistory.isRefreshing = false
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
