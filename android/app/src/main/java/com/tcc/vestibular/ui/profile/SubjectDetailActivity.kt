package com.tcc.vestibular.ui.profile

import android.content.res.ColorStateList
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.tcc.vestibular.data.api.ApiClient
import com.tcc.vestibular.databinding.ActivitySubjectDetailBinding
import kotlinx.coroutines.launch

class SubjectDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySubjectDetailBinding
    private lateinit var adapter: SubjectQuestionsAdapter
    private var subjectId: Int = 0
    private var subjectName: String = ""
    private var currentFilter: String = "correct" // "correct" ou "wrong"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySubjectDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        subjectId = intent.getIntExtra("EXTRA_SUBJECT_ID", 0)
        subjectName = intent.getStringExtra("EXTRA_SUBJECT_NAME") ?: "Matéria"

        binding.tvSubjectDetailTitle.text = subjectName

        setupRecyclerView()
        setupTabs()

        loadQuestions()
    }

    private fun setupRecyclerView() {
        adapter = SubjectQuestionsAdapter()
        binding.rvSubjectQuestions.apply {
            layoutManager = LinearLayoutManager(this@SubjectDetailActivity)
            this.adapter = this@SubjectDetailActivity.adapter
        }

        binding.swipeRefreshSubjectQuestions.setOnRefreshListener {
            loadQuestions()
        }
    }

    private fun setupTabs() {
        binding.btnTabCorrect.setOnClickListener {
            if (currentFilter != "correct") {
                currentFilter = "correct"
                updateTabStyles()
                loadQuestions()
            }
        }

        binding.btnTabWrong.setOnClickListener {
            if (currentFilter != "wrong") {
                currentFilter = "wrong"
                updateTabStyles()
                loadQuestions()
            }
        }
    }

    private fun updateTabStyles() {
        if (currentFilter == "correct") {
            binding.btnTabCorrect.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#4CAF50"))
            binding.btnTabCorrect.setTextColor(Color.WHITE)

            binding.btnTabWrong.backgroundTintList = ColorStateList.valueOf(Color.TRANSPARENT)
            binding.btnTabWrong.setTextColor(Color.parseColor("#E53935"))
        } else {
            binding.btnTabCorrect.backgroundTintList = ColorStateList.valueOf(Color.TRANSPARENT)
            binding.btnTabCorrect.setTextColor(Color.parseColor("#4CAF50"))

            binding.btnTabWrong.backgroundTintList = ColorStateList.valueOf(Color.parseColor("#E53935"))
            binding.btnTabWrong.setTextColor(Color.WHITE)
        }
    }

    private fun loadQuestions() {
        binding.swipeRefreshSubjectQuestions.isRefreshing = true

        lifecycleScope.launch {
            try {
                val apiService = ApiClient.getService(this@SubjectDetailActivity)
                val response = apiService.getSubjectQuestions(
                    subjectId = subjectId,
                    status = currentFilter,
                    page = 1,
                    limit = 50
                )

                if (response.isSuccessful && response.body() != null) {
                    val list = response.body()!!.data
                    adapter.setQuestions(list)
                    binding.tvEmptySubjectQuestions.visibility =
                        if (list.isEmpty()) View.VISIBLE else View.GONE
                } else {
                    Toast.makeText(this@SubjectDetailActivity, "Erro ao carregar questões.", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@SubjectDetailActivity, "Falha de conexão: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.swipeRefreshSubjectQuestions.isRefreshing = false
            }
        }
    }
}
