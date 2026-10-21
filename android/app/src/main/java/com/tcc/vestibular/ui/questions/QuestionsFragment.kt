package com.tcc.vestibular.ui.questions

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.tcc.vestibular.data.api.ApiClient
import com.tcc.vestibular.data.models.Subject
import com.tcc.vestibular.data.models.Vestibular
import com.tcc.vestibular.databinding.FragmentQuestionsBinding
import kotlinx.coroutines.launch

class QuestionsFragment : Fragment() {

    private var _binding: FragmentQuestionsBinding? = null
    private val binding get() = _binding!!

    private lateinit var questionAdapter: QuestionAdapter
    private var subjectsList = listOf<Subject>()
    private var vestibularesList = listOf<Vestibular>()
    private var yearsList = listOf<Int>()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentQuestionsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        loadFilters()

        binding.btnApplyFilters.setOnClickListener {
            loadQuestions()
        }

        binding.swipeRefresh.setOnRefreshListener {
            loadQuestions()
        }
    }

    private fun setupRecyclerView() {
        questionAdapter = QuestionAdapter { question ->
            val intent = Intent(requireContext(), QuestionDetailActivity::class.java)
            intent.putExtra("EXTRA_QUESTION", question)
            startActivity(intent)
        }
        binding.rvQuestions.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = questionAdapter
        }
    }

    private fun loadFilters() {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(requireContext())

                val subjectsResponse = apiService.getSubjects()
                if (subjectsResponse.isSuccessful) {
                    subjectsList = subjectsResponse.body() ?: emptyList()
                    val subjectNames = mutableListOf("Todas as Matérias")
                    subjectNames.addAll(subjectsList.map { it.name })
                    binding.spSubject.adapter = ArrayAdapter(
                        requireContext(),
                        android.R.layout.simple_spinner_dropdown_item,
                        subjectNames
                    )
                }

                val vestibularesResponse = apiService.getVestibulares()
                if (vestibularesResponse.isSuccessful) {
                    vestibularesList = vestibularesResponse.body() ?: emptyList()
                    val vestNames = mutableListOf("Todos os Vestibulares")
                    vestNames.addAll(vestibularesList.map { it.acronym })
                    binding.spVestibular.adapter = ArrayAdapter(
                        requireContext(),
                        android.R.layout.simple_spinner_dropdown_item,
                        vestNames
                    )
                }

                val yearsResponse = apiService.getYears()
                if (yearsResponse.isSuccessful) {
                    yearsList = yearsResponse.body() ?: emptyList()
                    val yearLabels = mutableListOf("Todos os Anos")
                    yearLabels.addAll(yearsList.map { it.toString() })
                    binding.spYear.adapter = ArrayAdapter(
                        requireContext(),
                        android.R.layout.simple_spinner_dropdown_item,
                        yearLabels
                    )
                }

                // Carga inicial de questões após carregar os filtros
                loadQuestions()
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Erro ao carregar filtros.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun loadQuestions() {
        binding.swipeRefresh.isRefreshing = true

        val selectedSubjectPos = binding.spSubject.selectedItemPosition
        val subjectId = if (selectedSubjectPos > 0 && selectedSubjectPos <= subjectsList.size) {
            subjectsList[selectedSubjectPos - 1].id
        } else null

        val selectedVestPos = binding.spVestibular.selectedItemPosition
        val vestId = if (selectedVestPos > 0 && selectedVestPos <= vestibularesList.size) {
            vestibularesList[selectedVestPos - 1].id
        } else null

        val selectedYearPos = binding.spYear.selectedItemPosition
        val year = if (selectedYearPos > 0 && selectedYearPos <= yearsList.size) {
            yearsList[selectedYearPos - 1]
        } else null

        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(requireContext())
                val response = apiService.getQuestions(
                    subjectId = subjectId,
                    year = year,
                    vestibularId = vestId,
                    page = 1,
                    limit = 50
                )

                if (response.isSuccessful && response.body() != null) {
                    val questions = response.body()!!.data
                    questionAdapter.setQuestions(questions)
                    binding.tvEmptyQuestions.visibility =
                        if (questions.isEmpty()) View.VISIBLE else View.GONE
                } else {
                    Toast.makeText(requireContext(), "Erro ao buscar questões.", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(requireContext(), "Falha de conexão: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
