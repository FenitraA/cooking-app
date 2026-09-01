"use client";

import { PlanningResult } from "@/lib/planning/types";
import DayPlanningCard from "./DayPlanningCard";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import {
  deletePlanningRecipe,
  fetchPlanning,
  fetchPlanningByDate,
} from "@/lib/planning/api";
import {
  formatDate,
  formatNumber,
  formatNumberToCurrency,
  getWeekRange,
} from "@/lib/utils";
import {
  ArrowLeftFromLine,
  ArrowRight,
  ArrowRightFromLine,
  Beef,
  X,
} from "lucide-react";
import DeleteConfirmModal from "@/components/forms/DeleteConfirmationModal";
import { Modal, ModalBody } from "flowbite-react";
import PlanningDetails from "./PlanningDetails";

const DAY_COLORS = [
  "bg-red-500/20",
  "bg-orange-500/20",
  "bg-yellow-500/20",
  "bg-green-500/20",
  "bg-cyan-500/20",
  "bg-blue-500/20",
  "bg-purple-500/20",
];

export default function PlanningList({
  refreshKey,
  onRefresh,
}: {
  refreshKey: number;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const translations = useTranslations("Planning");
  const general_translations = useTranslations("General");

  const triggerRefresh = () => onRefresh();

  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState<PlanningResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [planningIdToDelete, setPlanningIdToDelete] = useState("");

  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedPlanningRecipeId, setSelectedPlanningRecipeId] = useState("");

  const [openIngredientsModal, setOpenIngredientsModal] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);

    return monday;
  });

  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return sunday;
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const startDateString = startDate.toISOString().split("T")[0];
        const endDateString = endDate.toISOString().split("T")[0];

        const data: PlanningResult = await fetchPlanningByDate(
          startDateString,
          endDateString,
        );

        if (!cancelled) {
          setPlanning(data);
        }
      } catch (e: unknown) {
        if (cancelled) return;

        if (e instanceof UnauthorizedError) {
          router.replace("/login");
          return;
        }

        setError(getErrorMessage(e));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router, startDate, endDate, refreshKey]);

  function goToNextWeek() {
    setStartDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + 7);
      return next;
    });

    setEndDate((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + 7);
      return next;
    });
  }

  function goToPreviousWeek() {
    setStartDate((current) => {
      const previous = new Date(current);
      previous.setDate(previous.getDate() - 7);
      return previous;
    });

    setEndDate((current) => {
      const previous = new Date(current);
      previous.setDate(previous.getDate() - 7);
      return previous;
    });
  }
  function goToCurrentWeek() {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    setStartDate(monday);
    setEndDate(sunday);
  }

  function handleDeleteClick(planningRecipeId: string) {
    setOpenDeleteModal(true);
    setPlanningIdToDelete(planningRecipeId);
  }
  function handleEditClick(stockId: string) {
    setOpenEditModal(true);
    setSelectedPlanningRecipeId(stockId);
  }

  async function handleDeletePlanningRecipe() {
    setDeleteLoading(true);
    try {
      await deletePlanningRecipe({ planning_recipe_id: planningIdToDelete });
      triggerRefresh();
    } finally {
      setDeleteLoading(false);
      setOpenDeleteModal(false);
    }
  }
  return (
    <div className="rounded-xl border bg-white/10 p-6 shadow-hard-br">
      <header className="relative mx-1 flex items-center justify-center rounded-xl border border-custom-sand-dune/30 bg-custom-sand-dune/5 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-custom-sand-dune">
            {translations("title")}
          </h1>
        </div>
      </header>
      <div className="flex flex-row gap-2 justify-center items-center my-4 text-sm text-gray-300">
        <input
          type="date"
          value={startDate.toISOString().split("T")[0]}
          onChange={(e) => {
            if (!e.target.value) return;

            const newStart = new Date(`${e.target.value}T00:00:00`);

            if (newStart > endDate) {
              setError("Start date cannot be after end date");
              return;
            }

            setError(null);
            setStartDate(newStart);
          }}
          className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-gray-300 outline-none transition focus:border-custom-sand-dune/50 focus:ring-1 focus:ring-custom-sand-dune/30"
        />

        <ArrowRight size={16} className="text-custom-sand-dune" />

        <input
          type="date"
          value={endDate.toISOString().split("T")[0]}
          onChange={(e) => {
            if (!e.target.value) return;

            const newEnd = new Date(`${e.target.value}T00:00:00`);

            if (newEnd < startDate) {
              setError("End date cannot be before start date");
              return;
            }

            setError(null);
            setEndDate(newEnd);
          }}
          className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-gray-300 outline-none transition focus:border-custom-sand-dune/50 focus:ring-1 focus:ring-custom-sand-dune/30"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-white/10 px-3 py-2 mb-4 text-sm text-red-500">
          {error}
        </div>
      )}
      <div className="flex flex-row justify-center items-center gap-6 mb-5 w-full sm:w-1/3 mx-auto">
        <span className="font-semibold text-lg text-custom-money-green border-b border-custom-money-green">
          Total :{" "}
          {formatNumberToCurrency(planning?.total_estimated_cost_price || "0")}
        </span>
        <span className="flex justify-center items-center border border-white/20 rounded p-2">
          <Beef
            size={20}
            className="text-gray-300 hover:text-gray-100 cursor-pointer"
            onClick={() => {
              setOpenIngredientsModal(true);
            }}
          />
        </span>
      </div>
      <div className="overflow-y-auto relative h-[60vh] lg:min-h-130 sm:px-5 pb-5 border-t-2 pt-2 border-white/20">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:flex-wrap">
          {planning?.planning_repartitions.map((day, index) => (
            <DayPlanningCard
              key={day.planning_group_date}
              day={day.day_name}
              date={day.planning_group_date}
              total_price={day.estimated_cost_price}
              recipes={day.planning_recipes}
              colorClass={DAY_COLORS[index % DAY_COLORS.length]}
              onDeleteClick={handleDeleteClick}
              onEdit={handleEditClick}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mt-4 flex flex-wrap justify-center items-center gap-3">
          <button
            type="button"
            onClick={goToPreviousWeek}
            className="flex flex-row items-center gap-3 px-4 py-2 text-gray-300 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 cursor-pointer"
          >
            <ArrowLeftFromLine size={16} />{" "}
            <span className="hidden sm:inline">
              {general_translations("actions.previous")}
            </span>
          </button>

          <button
            type="button"
            onClick={goToCurrentWeek}
            className="px-4 py-2 rounded-lg bg-custom-sand-dune/20 border border-custom-sand-dune/40 text-custom-sand-dune hover:bg-custom-sand-dune/30 cursor-pointer"
          >
            {general_translations("actions.this_week")}
          </button>

          <button
            type="button"
            onClick={goToNextWeek}
            className="flex flex-row items-center gap-3 px-4 py-2 text-gray-300 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 cursor-pointer"
          >
            <span className="hidden sm:inline">
              {general_translations("actions.next")}
            </span>{" "}
            <ArrowRightFromLine size={16} />
          </button>
        </div>
      </div>
      <DeleteConfirmModal
        open={openDeleteModal}
        onCancel={() => setOpenDeleteModal(false)}
        onConfirm={handleDeletePlanningRecipe}
        loading={deleteLoading}
      />
      <Modal
        size="7xl"
        show={openEditModal}
        onClose={() => setOpenEditModal(false)}
      >
        <ModalBody className="bg-custom-dark-blue border border-custom-sand-dune">
          <div className="flex text-xl text-custom-sand-dune flex-row justify-between w-full mb-3 pb-3 border-b border-custom-sand-dune">
            <h2>{translations("edit_title")}</h2>
            <button
              className="flex justify-center items-center cursor-pointer h-6 w-6 border border-custom-sand-dune rounded-full text-custom-sand-dune hover:bg-custom-sand-dune/20"
              onClick={() => setOpenEditModal(false)}
              aria-label={general_translations("actions.select")}
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-6">
            <PlanningDetails
              planningRecipeId={selectedPlanningRecipeId}
              onUpdated={triggerRefresh}
            />
          </div>
        </ModalBody>
      </Modal>
      <Modal
        size="2xl"
        show={openIngredientsModal}
        onClose={() => setOpenIngredientsModal(false)}
      >
        <ModalBody className="bg-custom-dark-blue border border-custom-sand-dune">
          <div className="flex text-xl text-custom-sand-dune flex-row justify-between w-full mb-3 pb-3 border-b border-custom-sand-dune">
            <h2>{translations("ingredients_list")}</h2>
            <button
              className="flex justify-center items-center cursor-pointer h-6 w-6 border border-custom-sand-dune rounded-full text-custom-sand-dune hover:bg-custom-sand-dune/20"
              onClick={() => setOpenIngredientsModal(false)}
              aria-label={general_translations("actions.select")}
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-3 space-y-2 pt-4 border-t border-white/20 pb-6 flex flex-col max-h-[40vh] overflow-auto">
            {planning?.ingredients_to_buy.map((item) => (
              <div
                key={item.recipe_ingredient_base.ref_ingredient_id}
                className="
                          flex
                          items-center
                          justify-between
                          gap-4
                          border-l-4
                          border-custom-sand-dune/50
                          bg-white/10
                          p-3
                          w-full
                        "
              >
                <div
                  className="
                            flex
                            flex-col
                            gap-2
                            flex-1
                          "
                >
                  <div className="font-semibold text-gray-300">
                    {item.ingredient_name}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="text-custom-sand-dune">
                      {formatNumber(item.recipe_ingredient_base.quantity)}{" "}
                      {item.ingredient_unit}
                    </span>

                    <span className="ml-2 text-custom-money-green font-semibold">
                      {formatNumberToCurrency(
                        item.estimated_cost_per_unit *
                          Number(item.recipe_ingredient_base.quantity),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
