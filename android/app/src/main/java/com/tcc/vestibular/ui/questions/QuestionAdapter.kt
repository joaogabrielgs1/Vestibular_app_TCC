package com.tcc.vestibular.ui.questions

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.tcc.vestibular.data.models.Question
import com.tcc.vestibular.databinding.ItemQuestionBinding

class QuestionAdapter(
    private val onSolveClick: (Question) -> Unit
) : RecyclerView.Adapter<QuestionAdapter.QuestionViewHolder>() {

    private val questions = mutableListOf<Question>()

    fun setQuestions(newList: List<Question>) {
        questions.clear()
        questions.addAll(newList)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): QuestionViewHolder {
        val binding = ItemQuestionBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return QuestionViewHolder(binding)
    }

    override fun onBindViewHolder(holder: QuestionViewHolder, position: Int) {
        holder.bind(questions[position])
    }

    override fun getItemCount(): Int = questions.size

    inner class QuestionViewHolder(private val binding: ItemQuestionBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(question: Question) {
            binding.tvQuestionBadge.text = "${question.vestibularAcronym} ${question.year}"
            binding.tvSubjectBadge.text = question.subjectName
            binding.tvQuestionStatement.text = question.statement

            binding.btnSolveQuestion.setOnClickListener {
                onSolveClick(question)
            }
        }
    }
}
