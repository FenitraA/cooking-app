"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { getErrorMessage, UnauthorizedError } from "@/lib/errors";
import { Modal, ModalBody } from "flowbite-react";
import { Clock, Funnel, Soup, X } from "lucide-react";
import FilterField from "@/components/forms/FilterField";
import { IngredientBase } from "@/lib/ingredient/types";
import CustomPagination from "@/components/forms/CustomPagination";
import {
  RecipeRead,
  RecipeSearchParams,
  RecipeSearchResult,
} from "@/lib/recipe/types";
import { fetchRecipesSearch } from "@/lib/recipe/api";
import GeneralAutocompleteList from "@/components/forms/GeneralAutocompleteList";
import { fetchIngredientByName } from "@/lib/ingredient/api";
import RecipeCard from "../RecipeCard";
import RecipeDetailsPage from "../Details";
import SafeImage from "@/components/forms/SafeImage";

export default function RecipeListPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const router = useRouter();
  const translations = useTranslations("Recipe");
  const general_translations = useTranslations("General");

  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedRecipeID, setSelectedRecipeID] = useState("");

  const [selectedIngredients, setSelectedIngredients] = useState<
    IngredientBase[]
  >([]);

  const [recipeSearchParams, setRecipeSearchParams] =
    useState<RecipeSearchParams>({
      limit: 50,
      offset: 0,
      name: undefined,
      max_making_time: undefined,
      ingredient_ids: undefined,
    });

  const debouncedSearchParams = useDebounce(recipeSearchParams, 400);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<RecipeRead[]>([]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pagination = useMemo(() => {
    const perPage = Math.max(1, recipeSearchParams.limit ?? 50);
    const currentPage =
      Math.floor((recipeSearchParams.offset ?? 0) / perPage) + 1;
    const totalPages = Math.max(1, Math.ceil((total ?? 0) / perPage));
    return { currentPage, perPage, totalPages };
  }, [recipeSearchParams.limit, recipeSearchParams.offset, total]);

  function onPageChange(newPage: number) {
    const perPage = Math.max(1, recipeSearchParams.limit ?? 50);
    setRecipeSearchParams((p) => ({
      ...p,
      offset: (newPage - 1) * perPage,
    }));
  }

  function setName(v: string) {
    setRecipeSearchParams((p) => ({
      ...p,
      name: v || undefined,
      offset: 0,
    }));
  }
  function setMaxMakingTime(v: string) {
    setRecipeSearchParams((p) => ({
      ...p,
      max_making_time: v || undefined,
      offset: 0,
    }));
  }
  function preview_image(imageUrl: string) {
    setSelectedImage(imageUrl);
  }

  useEffect(() => {
    const ingredientIds = selectedIngredients.map(
      (ingredient) => ingredient.id,
    );

    setRecipeSearchParams((p) => ({ ...p, ingredient_ids: ingredientIds }));
  }, [selectedIngredients]);
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data: RecipeSearchResult = await fetchRecipesSearch(
          debouncedSearchParams,
        );

        setTotal(data.total);
        setRecipes(data.items);
      } catch (e: unknown) {
        if (cancelled) return;

        if (e instanceof UnauthorizedError) {
          router.replace("/login");
          return;
        }

        setError(getErrorMessage(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router, debouncedSearchParams, refreshKey]);

  // Filter section control
  const [openFilters, setOpenFilters] = useState(false);

  function changeOpenFilter() {
    setOpenFilters((p) => !p);
  }
  const Filters = (
    <div className="flex flex-col sm:p-6 gap-6 mb-3 w-full h-full lg:min-w-64 sm:bg-white/10 rounded-xl sm:border border-white/20">
      <header className="lg:block hidden text-center mb-2 px-2 py-2 border-b border-custom-sand-dune">
        <h2 className="text-md font-semibold text-custom-sand-dune tracking-tight">
          {general_translations("search_filters")}
        </h2>
      </header>
      <FilterField
        icon={Soup}
        value={recipeSearchParams.name ?? ""}
        onChange={setName}
        placeholder={translations("filters.name")}
      />

      <FilterField
        icon={Clock}
        value={String(recipeSearchParams.max_making_time ?? "")}
        onChange={setMaxMakingTime}
        placeholder={translations("filters.max_making_time")}
      />
      <GeneralAutocompleteList
        translationsKey="Ingredient"
        label="Ingredients"
        values={selectedIngredients}
        onChange={setSelectedIngredients}
        getKey={(i) => i.id}
        getName={(i) => i.name}
        fetchOptions={fetchIngredientByName}
      />
    </div>
  );

  return (
    <div className="rounded-xl border w-full mt-6 mx-auto min-h-full bg-white/10 py-4 px-6 shadow-hard-br space-y-6">
      <header className="relative mb-4 mx-1 flex items-center justify-center rounded-xl border border-custom-sand-dune/30 bg-custom-sand-dune/5 px-6 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-custom-sand-dune">
            {translations("list_title")}
          </h1>
        </div>

        <div className="lg:hidden absolute right-2">
          <button
            type="button"
            onClick={changeOpenFilter}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-300 transition-all hover:border-custom-sand-dune/40 hover:bg-custom-sand-dune/10 hover:text-custom-sand-dune"
          >
            <Funnel size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-full">
        <div className="hidden lg:block mb-3">{Filters}</div>
        <div
          className={`
            lg:hidden
            overflow-hidden
            transition-all
            duration-300
            ${openFilters ? "max-h-125 opacity-100" : "max-h-1 opacity-0"}
          `}
        >
          {Filters}
        </div>
        <div className="flex flex-col gap-6 mb-3 flex-1 min-w-32 rounded-xl">
          {error && (
            <div className="rounded-lg bg-white/10 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}
          <div className="relative flex-1 bg-white/10 border border-white/20 p-2 rounded-xl shadow-hard-br mb-3">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-gray-800" />
              </div>
            )}

            {/* <div className="text-xs text-gray-400 ml-2 mb-2">
            {translations("count_label")} :{" "}
            <span className="text-gray-700 font-bold">{total}</span>
          </div> */}

            <div className="flex flex-col gap-4 overflow-y-auto h-[60vh] lg:h-150">
              {recipes.map((item) => (
                <div
                  key={item.recipe.id}
                  className="relative rounded-xl w-full sm:px-3"
                >
                  <RecipeCard
                    key={item.recipe.id}
                    data={item}
                    onEdit={() => {
                      setSelectedRecipeID(item.recipe.id);
                      setOpenEditModal(true);
                    }}
                    onImageClick={preview_image}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex flex-row justify-center bg-white/10 border p-2 rounded-xl border-white/20 overflow-auto shadow-hard-br">
            <div className="overflow-x-auto">
              <CustomPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={onPageChange}
                previousLabel={general_translations("actions.previous")}
                nextLabel={general_translations("actions.next")}
                showIcons
              />
            </div>
          </div>
        </div>
      </div>

      <Modal
        size="8xl"
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
            <RecipeDetailsPage
              recipeId={selectedRecipeID}
              onUpdated={triggerRefresh}
            />
          </div>
        </ModalBody>
      </Modal>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full h-[80vh] mx-4">
            <SafeImage
              src={selectedImage}
              alt="Full view"
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
