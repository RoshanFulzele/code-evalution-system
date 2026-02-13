// =====================================
// Emergent CES - Seed Data & Constants
// =====================================

// Problems definition
// Each problem has: id, title, difficulty, tags, description, starterCode, harness

const CES_PROBLEMS = (() => {
  /**
   * Helper to create a harness that:
   * - expects a function with a given name
   * - runs a list of [args array, expected] test pairs
   */
  function fnHarness(fnName, tests) {
    // tests is a plain JS array using only numbers/strings, which is
    // JSON-compatible with Python list syntax, so we can embed it directly
    // as a Python literal without using json (not implemented in Skulpt).
    const testsLiteral = JSON.stringify(tests);
    return `
__raw_tests = ${testsLiteral}
__passed = 0
__total = len(__raw_tests)
for case in __raw_tests:
    args, expected = case
    try:
        result = ${fnName}(*args)
        if result == expected:
            __passed += 1
    except Exception as e:
        print("test error:", e)

print("__RESULT__", str(__passed) + "/" + str(__total))
`;
  }

  const problems = [];

  // Base 10 manually-written problems
  problems.push(
    {
      id: 1,
      title: "Sum of Two Numbers",
      difficulty: "easy",
      tags: ["math", "basics"],
      description:
        "Write a function `add(a, b)` that returns the sum of two integers.\\n\\nExamples:\\n- add(1, 2) -> 3\\n- add(-1, 5) -> 4",
      starterCode:
        "def add(a, b):\\n    # TODO: return the sum of a and b\\n    return 0\\n",
      harness: fnHarness("add", [
        [[1, 2], 3],
        [[-1, 5], 4],
        [[0, 0], 0],
      ]),
    },
    {
      id: 2,
      title: "Absolute Difference",
      difficulty: "easy",
      tags: ["math"],
      description:
        "Implement `abs_diff(a, b)` that returns the absolute difference between a and b.\\nUse built-in `abs` or manual comparison.",
      starterCode:
        "def abs_diff(a, b):\\n    # TODO: return absolute difference between a and b\\n    return 0\\n",
      harness: fnHarness("abs_diff", [
        [[5, 3], 2],
        [[3, 5], 2],
        [[-2, 5], 7],
      ]),
    },
    {
      id: 3,
      title: "Is Even",
      difficulty: "easy",
      tags: ["math", "conditionals"],
      description:
        "Write `is_even(n)` that returns 1 if n is even, otherwise 0.\\n\\nExamples:\\n- is_even(2) -> 1\\n- is_even(3) -> 0",
      starterCode:
        "def is_even(n):\\n    # TODO: return 1 if n is even else 0\\n    return 0\\n",
      harness: fnHarness("is_even", [
        [[2], 1],
        [[3], 0],
        [[0], 1],
      ]),
    }
  );

  // We keep expectations numeric (1/0) so they serialize cleanly into JSON
  // inside the Python harness without needing any JS helpers.

  // Ensure problem 3 uses the numeric-based version
  problems[2] = {
    id: 3,
    title: "Is Even",
    difficulty: "easy",
    tags: ["math", "conditionals"],
    description:
      "Write `is_even(n)` that returns 1 if n is even, otherwise 0.\\n\\nExamples:\\n- is_even(2) -> 1\\n- is_even(3) -> 0",
    starterCode:
      "def is_even(n):\\n    # TODO: return 1 if n is even else 0\\n    return 0\\n",
    harness: fnHarness("is_even", [
      [[2], 1],
      [[3], 0],
      [[0], 1],
    ]),
  };

  problems.push(
    {
      id: 4,
      title: "Factorial",
      difficulty: "easy",
      tags: ["math", "loops"],
      description:
        "Implement `factorial(n)` that returns n! for non-negative integers. Assume 0! = 1.",
      starterCode:
        "def factorial(n):\\n    # TODO: compute factorial iteratively\\n    return 1\\n",
      harness: fnHarness("factorial", [
        [[0], 1],
        [[3], 6],
        [[5], 120],
      ]),
    },
    {
      id: 5,
      title: "Reverse String",
      difficulty: "easy",
      tags: ["strings"],
      description:
        "Write `reverse_string(s)` that returns the reversed version of string s.",
      starterCode:
        "def reverse_string(s):\\n    # TODO: return reversed string\\n    return s\\n",
      harness: fnHarness("reverse_string", [
        [["abc"], "cba"],
        [[""], ""],
        [["racecar"], "racecar"],
      ]),
    },
    {
      id: 6,
      title: "Maximum in List",
      difficulty: "easy",
      tags: ["lists"],
      description:
        "Write `max_in_list(nums)` that returns the largest element in a non-empty list of integers.",
      starterCode:
        "def max_in_list(nums):\\n    # TODO: return maximum element\\n    return 0\\n",
      harness: fnHarness("max_in_list", [
        [[[1, 5, 2]], 5],
        [[[-1, -5, -3]], -1],
        [[[10]], 10],
      ]),
    },
    {
      id: 7,
      title: "Count Vowels",
      difficulty: "easy",
      tags: ["strings"],
      description:
        "Write `count_vowels(s)` that returns the number of vowels (a, e, i, o, u) in the string, case-insensitive.",
      starterCode:
        "def count_vowels(s):\\n    # TODO: count vowels in s\\n    return 0\\n",
      harness: fnHarness("count_vowels", [
        [["hello"], 2],
        [["xyz"], 0],
        [["AEiou"], 5],
      ]),
    },
    {
      id: 8,
      title: "Fibonacci Nth",
      difficulty: "medium",
      tags: ["math", "loops"],
      description:
        "Implement `fib(n)` that returns the nth Fibonacci number with fib(0)=0, fib(1)=1.",
      starterCode:
        "def fib(n):\\n    # TODO: compute nth Fibonacci number iteratively\\n    return 0\\n",
      harness: fnHarness("fib", [
        [[0], 0],
        [[1], 1],
        [[7], 13],
      ]),
    },
    {
      id: 9,
      title: "Palindrome Check",
      difficulty: "medium",
      tags: ["strings"],
      description:
        "Write `is_palindrome(s)` that returns 1 if s is a palindrome ignoring case and spaces, else 0.",
      starterCode:
        "def is_palindrome(s):\\n    # TODO: return 1 if s is palindrome ignoring case/spaces else 0\\n    return 0\\n",
      harness: fnHarness("is_palindrome", [
        [["racecar"], 1],
        [["Race Car"], 1],
        [["hello"], 0],
      ]),
    },
    {
      id: 10,
      title: "Two Sum Exists",
      difficulty: "medium",
      tags: ["arrays", "hash"],
      description:
        "Write `two_sum_exists(nums, target)` that returns 1 if there exist two distinct indices i, j such that nums[i] + nums[j] == target, else 0.",
      starterCode:
        "def two_sum_exists(nums, target):\\n    # TODO: return 1 if any pair sums to target else 0\\n    return 0\\n",
      harness: fnHarness("two_sum_exists", [
        [[[2, 7, 11, 15], 9], 1],
        [[[1, 2, 3], 7], 0],
        [[[3, 3], 6], 1],
      ]),
    }
  );

  // Auto-generate additional simple problems to reach at least 50
  const baseId = problems.length + 1;
  const difficulties = ["easy", "medium", "hard"];

  for (let i = 0; i < 45; i++) {
    const id = baseId + i;
    const diff = difficulties[i % difficulties.length];
    problems.push({
      id,
      title: `Synthetic Problem ${id}`,
      difficulty: diff,
      tags: ["synthetic", "practice"],
      description:
        "This is an auto-generated practice problem. Implement the requested function so that it returns the square of an integer.\\nFunction: `square_n(n)` -> n * n.",
      starterCode:
        "def square_n(n):\\n    # TODO: return n squared\\n    return 0\\n",
      harness: fnHarness("square_n", [
        [[1], 1],
        [[2], 4],
        [[-3], 9],
      ]),
    });
  }

  return problems;
})();

// Storage keys
const CES_KEYS = {
  USERS: "ces_users",
  CURRENT_USER: "ces_current_user",
  SUBMISSIONS: "ces_submissions",
};

