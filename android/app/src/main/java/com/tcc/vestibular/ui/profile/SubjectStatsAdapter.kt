package com.tcc.vestibular.ui.profile

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.tcc.vestibular.data.models.SubjectStats
import com.tcc.vestibular.databinding.ItemSubjectStatBinding

class SubjectStatsAdapter(
    private val onSubjectClick: ((SubjectStats) -> Unit)? = null
) : RecyclerView.Adapter<SubjectStatsAdapter.StatViewHolder>() {

    private val statsList = mutableListOf<SubjectStats>()

    fun setStats(newList: List<SubjectStats>) {
        statsList.clear()
        statsList.addAll(newList)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StatViewHolder {
        val binding = ItemSubjectStatBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return StatViewHolder(binding)
    }

    override fun onBindViewHolder(holder: StatViewHolder, position: Int) {
        holder.bind(statsList[position])
    }

    override fun getItemCount(): Int = statsList.size

    inner class StatViewHolder(private val binding: ItemSubjectStatBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(stat: SubjectStats) {
            binding.tvSubjectName.text = stat.subjectName
            binding.tvSubjectPercentage.text = "${stat.accuracyPercentage}%"
            binding.tvSubjectCounts.text =
                "${stat.totalAnswered} resolvidas • ${stat.totalCorrect} acertos • ${stat.totalWrong} erros"

            binding.root.setOnClickListener {
                onSubjectClick?.invoke(stat)
            }
        }
    }
}
